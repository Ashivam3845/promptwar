import { NextRequest, NextResponse } from 'next/server';
import { getOpenAIClient, defaultModel, isOpenAIConfigured } from '@/lib/openai';


export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      description,
      platformOrEmployer,
      incidentDate,
      amountDisputed,
      recipientCategory,
      language = 'en',
    } = body;

    if (!description || !description.trim()) {
      return NextResponse.json(
        { error: 'Description of the problem is required.' },
        { status: 400 }
      );
    }

    if (!isOpenAIConfigured) {
      return NextResponse.json(
        {
          error: 'OPENAI_API_KEY is not configured on the server. Please set OPENAI_API_KEY in .env.local to enable live AI complaint generation.',
          isConfigError: true,
        },
        { status: 503 }
      );
    }

    const openai = getOpenAIClient();
    if (!openai) {
      return NextResponse.json(
        { error: 'OpenAI client failed to initialize.' },
        { status: 500 }
      );
    }

    const targetRecipient = recipientCategory || 'Company Grievance Cell';
    const langPrompt =
      language === 'hi'
        ? 'Generate all textual content and the formal letter in clear, respectful, professional Hindi.'
        : language === 'pa'
        ? 'Generate all textual content and the formal letter in clear, respectful, professional Punjabi.'
        : 'Generate all textual content and the formal letter in professional, firm, yet polite English.';

    const systemPrompt = `You are a formal legal and grievance drafting assistant specializing in Indian labour practices, platform aggregator dispute mechanisms, and consumer rights.
${langPrompt}

You will receive an informal description from a gig worker or daily wage earner regarding an issue (such as unfair penalties, wrongful ID block, withheld tip/incentive, or unsafe dispatch).
Generate a JSON structured response with:
1. "title": A short, clear headline for this case.
2. "subject": A standard formal subject line with order ID or date if supplied.
3. "formalLetter": A complete, polished, ready-to-send formal representation letter addressed to ${targetRecipient}. Must include date, salutation, factual breakdown, grounds of unfair practice / lack of natural justice, clear demanded remedies, polite closing, and signature block placeholder.
4. "factsSummary": An array of 3-5 concise bullet points summarizing verifiable facts.
5. "legalFairnessBasis": An array of 2-4 points citing principles of natural justice, fair business practices, consumer protection norms, or motor vehicle guidelines where applicable.
6. "requestedRelief": An array of specific remedies requested (e.g., immediate refund of amount, restoration of worker account).
7. "supportingEvidence": An array of 3-5 concrete pieces of evidence the worker should attach (e.g., in-app screenshots, order timestamps, GPS logs).

Output valid JSON only. Do not wrap in markdown quotes if possible, or use standard JSON.`;

    const userPrompt = `
Platform / Employer: ${platformOrEmployer || 'Digital Platform Aggregator'}
Incident Date: ${incidentDate || new Date().toISOString().split('T')[0]}
Amount Disputed: ${amountDisputed ? '₹' + amountDisputed : 'Not specified'}
Intended Recipient: ${targetRecipient}
Worker's description of what happened:
"""
${description.slice(0, 3000)}
"""
`;

    const response = await openai.chat.completions.create({
      model: defaultModel,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3,
    });

    const rawContent = response.choices[0]?.message?.content || '{}';
    const parsed = JSON.parse(rawContent);

    return NextResponse.json({
      title: parsed.title || 'Grievance Representation',
      subject: parsed.subject || `Formal Grievance: Disputed Matter with ${platformOrEmployer || 'Platform'}`,
      formalLetter: parsed.formalLetter || '',
      factsSummary: Array.isArray(parsed.factsSummary) ? parsed.factsSummary : [],
      legalFairnessBasis: Array.isArray(parsed.legalFairnessBasis) ? parsed.legalFairnessBasis : [],
      requestedRelief: Array.isArray(parsed.requestedRelief) ? parsed.requestedRelief : [],
      supportingEvidence: Array.isArray(parsed.supportingEvidence) ? parsed.supportingEvidence : [],
      platformOrEmployer: platformOrEmployer || 'Platform',
      incidentDate: incidentDate || new Date().toISOString().split('T')[0],
      amountDisputed: amountDisputed ? Number(amountDisputed) : undefined,
      recipientCategory: targetRecipient,
      language,
    });
  } catch (error: any) {
    console.error('Error in /api/complaints/generate:', error);
    const errorMessage = error?.message || 'Upstream OpenAI service failure';
    const status = error?.status || 500;
    return NextResponse.json(
      { error: `Complaint Generator Error: ${errorMessage}` },
      { status: status >= 400 && status < 600 ? status : 500 }
    );
  }
}
