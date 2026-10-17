import { NextRequest, NextResponse } from 'next/server';
import {
  getOpenAIClient,
  defaultOpenAiModel,
  isOpenAIConfigured,
  isGeminiConfigured,
  callGeminiGenerate,
} from '@/lib/openai';
import { VERIFIED_SCHEMES } from '@/lib/schemes';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { messages, language = 'en' } = body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: 'Invalid request: "messages" array is required.' },
        { status: 400 }
      );
    }

    // Safety checks: payload size limit
    const latestUserMessage = messages[messages.length - 1]?.content || '';
    if (typeof latestUserMessage !== 'string' || latestUserMessage.length > 2000) {
      return NextResponse.json(
        { error: 'Message content is too long. Please keep under 2,000 characters.' },
        { status: 400 }
      );
    }

    if (!isOpenAIConfigured && !isGeminiConfigured) {
      return NextResponse.json(
        {
          error: 'No active AI key configured on the server. Please set OPENAI_API_KEY or GEMINI_API_KEY in .env.',
          isConfigError: true,
        },
        { status: 503 }
      );
    }

    // Curate schemes context to feed into retrieval-augmented prompt
    const verifiedSchemesContext = VERIFIED_SCHEMES.map((s) => ({
      name: s.name,
      jurisdiction: s.jurisdiction,
      url: s.officialSourceUrl,
      benefits: s.verifiedBenefits,
      eligibility: s.eligibilityCriteria,
      exclusions: s.relevantExclusions,
      steps: s.applicationSteps,
      summary: s.summary,
    }));

    const langInstruction =
      language === 'hi'
        ? 'You MUST reply in fluent, respectful, natural Hindi (Devanagari script).'
        : language === 'pa'
        ? 'You MUST reply in fluent, respectful, natural Punjabi (Gurmukhi script).'
        : 'You MUST reply in clear, empathetic, plain English suitable for everyday gig workers.';

    const systemPrompt = `You are "GigSaathi AI" (गिग साथी), an empathetic, knowledgeable, and reliable AI assistant dedicated to India's gig workers, delivery executives, cab drivers, and informal workers.

CORE PRINCIPLES:
1. ${langInstruction}
2. Plain language: Avoid overly dense corporate legal jargon. Explain terms simply.
3. Truthfulness & Official Sourcing: Never invent laws, penalties, court precedents, phone numbers, or scheme eligibility criteria.
4. When relevant, cite official schemes and official URLs from the verified list below:
${JSON.stringify(verifiedSchemesContext, null, 2)}
5. If the user asks about something outside verified facts or uncertain platform internal policies, explicitly state uncertainty and suggest contacting the official platform grievance desk or National Consumer Helpline (NCH 1915).
6. Always acknowledge the worker's effort and stress with dignity and empathy.`;

    let reply = '';
    let modelUsed = '';

    // Primary: Try OpenAI if configured
    let openaiFailed = false;
    if (isOpenAIConfigured) {
      try {
        const openai = getOpenAIClient();
        if (openai) {
          const formattedMessages = [
            { role: 'system' as const, content: systemPrompt },
            ...messages.slice(-8).map((m: { role: string; content: string }) => ({
              role: (m.role === 'user' ? 'user' : 'assistant') as 'user' | 'assistant',
              content: String(m.content),
            })),
          ];

          const completion = await openai.chat.completions.create({
            model: defaultOpenAiModel,
            messages: formattedMessages,
            temperature: 0.4,
            max_tokens: 800,
          });

          reply = completion.choices[0]?.message?.content || '';
          modelUsed = defaultOpenAiModel;
        }
      } catch (openAiErr: any) {
        console.warn('OpenAI request failed, falling back to Gemini:', openAiErr.message);
        openaiFailed = true;
      }
    }

    // Secondary / Fallback: Gemini 3.8 Flash
    if ((!isOpenAIConfigured || openaiFailed || !reply) && isGeminiConfigured) {
      const contents = messages.slice(-8).map((m: { role: string; content: string }) => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: String(m.content) }],
      }));

      reply = await callGeminiGenerate({
        contents,
        systemInstruction: systemPrompt,
      });
      modelUsed = 'gemini-3.8-flash';
    }

    // Match any referenced schemes to return structured source links
    const referencedSources: { name: string; url: string }[] = [];
    for (const scheme of VERIFIED_SCHEMES) {
      if (
        reply.toLowerCase().includes(scheme.name.toLowerCase().split(' ')[0]) ||
        reply.includes(scheme.officialSourceUrl)
      ) {
        referencedSources.push({
          name: scheme.name,
          url: scheme.officialSourceUrl,
        });
      }
    }

    return NextResponse.json({
      reply,
      sources: referencedSources,
      modelUsed,
    });
  } catch (error: any) {
    console.error('Error in /api/chat:', error);
    const errorMessage = error?.message || 'Upstream AI service failure';
    const status = error?.status || 500;
    return NextResponse.json(
      { error: `AI Assistant Error: ${errorMessage}` },
      { status: status >= 400 && status < 600 ? status : 500 }
    );
  }
}
