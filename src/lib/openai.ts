/**
 * Unified AI Provider Client for GigSaathi AI
 * Primary: OpenAI. Fallback: Google Gemini (REST), used when OpenAI is unconfigured or fails.
 */

import OpenAI from 'openai';

const openAiKey = process.env.OPENAI_API_KEY || '';
const geminiKey = process.env.GEMINI_API_KEY || '';

export const isOpenAIConfigured = Boolean(openAiKey && !openAiKey.startsWith('your_openai'));
export const isGeminiConfigured = Boolean(geminiKey && !geminiKey.startsWith('your_gemini'));

export const isAiConfigured = isOpenAIConfigured || isGeminiConfigured;

export const defaultOpenAiModel = process.env.OPENAI_MODEL || 'gpt-4o-mini';
export const defaultGeminiModel = process.env.GEMINI_MODEL || 'gemini-3.8-flash';

const GEMINI_TIMEOUT_MS = 30_000;

export function getOpenAIClient(): OpenAI | null {
  if (!isOpenAIConfigured) return null;
  return new OpenAI({ apiKey: openAiKey });
}

export interface GeminiContent {
  role?: 'user' | 'model';
  parts: { text: string }[];
}

interface GeminiResponse {
  candidates?: { content?: { parts?: { text?: string }[] } }[];
  error?: { message?: string };
}

/**
 * Call the Gemini REST API. The key travels in the x-goog-api-key header,
 * not the URL, so it never ends up in proxy or access logs.
 */
export async function callGeminiGenerate(params: {
  contents: GeminiContent[];
  systemInstruction?: string;
  responseFormatJson?: boolean;
}): Promise<string> {
  if (!geminiKey) {
    throw new Error('GEMINI_API_KEY is not configured on the server.');
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${defaultGeminiModel}:generateContent`;

  const body: Record<string, unknown> = { contents: params.contents };
  if (params.systemInstruction) {
    body.systemInstruction = { parts: [{ text: params.systemInstruction }] };
  }
  if (params.responseFormatJson) {
    body.generationConfig = { responseMimeType: 'application/json' };
  }

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': geminiKey },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(GEMINI_TIMEOUT_MS),
  });

  const data = (await res.json()) as GeminiResponse;
  if (!res.ok) {
    throw new Error(data.error?.message || `Gemini API error (HTTP ${res.status})`);
  }

  const candidate = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!candidate) {
    throw new Error('Gemini API returned an empty completion.');
  }

  return candidate;
}
