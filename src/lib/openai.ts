import OpenAI from 'openai';

const apiKey = process.env.OPENAI_API_KEY || '';

export const isOpenAIConfigured = Boolean(apiKey && !apiKey.startsWith('your_openai'));

export const defaultModel = process.env.OPENAI_MODEL || 'gpt-4o-mini';

export function getOpenAIClient(): OpenAI | null {
  if (!isOpenAIConfigured) return null;
  return new OpenAI({
    apiKey,
  });
}
