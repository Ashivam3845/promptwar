/**
 * Unified AI Provider Client for GigSaathi AI
 * Automatically supports OpenAI with seamless, zero-friction fallback to Gemini (gemini-3.8-flash)
 */

import OpenAI from 'openai';

const openAiKey = process.env.OPENAI_API_KEY || '';
const geminiKey = process.env.GEMINI_API_KEY || process.env['gemini api key'] || '';

export const isOpenAIConfigured = Boolean(openAiKey && !openAiKey.startsWith('your_openai'));
export const isGeminiConfigured = Boolean(geminiKey && !geminiKey.startsWith('your_gemini'));

export const isAiConfigured = isOpenAIConfigured || isGeminiConfigured;

export const defaultOpenAiModel = process.env.OPENAI_MODEL || 'gpt-4o-mini';
export const defaultGeminiModel = 'gemini-3.8-flash';

export function getOpenAIClient(): OpenAI | null {
  if (!isOpenAIConfigured) return null;
  return new OpenAI({ apiKey: openAiKey });
}

export function getGeminiApiKey(): string {
  return geminiKey;
}

/**
 * Call Gemini REST API directly with gemini-3.8-flash
 */
export async function callGeminiGenerate(params: {
  contents: any[];
  systemInstruction?: string;
  responseFormatJson?: boolean;
}): Promise<string> {
  const key = getGeminiApiKey();
  if (!key) {
    throw new Error('GEMINI_API_KEY is not configured on the server.');
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${defaultGeminiModel}:generateContent?key=${key}`;

  const body: any = {
    contents: params.contents,
  };

  if (params.systemInstruction) {
    body.systemInstruction = {
      parts: [{ text: params.systemInstruction }],
    };
  }

  if (params.responseFormatJson) {
    body.generationConfig = {
      responseMimeType: 'application/json',
    };
  }

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error?.message || `Gemini API error (HTTP ${res.status})`);
  }

  const candidate = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!candidate) {
    throw new Error('Gemini API returned an empty completion.');
  }

  return candidate;
}
