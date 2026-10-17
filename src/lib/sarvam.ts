import { SupportedLanguage } from '@/types';

/**
 * Sarvam AI Service Client & Constants
 * Base URL: https://api.sarvam.ai
 * Auth Header: api-subscription-key
 */

const SARVAM_BASE_URL = 'https://api.sarvam.ai';

const STT_TIMEOUT_MS = 25_000;
const TTS_TIMEOUT_MS = 20_000;
const DOC_REQUEST_TIMEOUT_MS = 30_000;
const DOC_POLL_INTERVAL_MS = 2_000;
const DOC_POLL_MAX_TOTAL_MS = 30_000;

/** Longest text sent for speech synthesis in one request. */
export const MAX_TTS_CHARS = 1500;

const SUPPORTED_LANGUAGES: readonly SupportedLanguage[] = ['en', 'hi', 'pa'];

/** Coerces untrusted input to a supported language, falling back when it is missing or unknown. */
export function normalizeLanguage(value: unknown, fallback: SupportedLanguage = 'en'): SupportedLanguage {
  return typeof value === 'string' && (SUPPORTED_LANGUAGES as readonly string[]).includes(value)
    ? (value as SupportedLanguage)
    : fallback;
}

function isAbortOrTimeout(err: unknown): boolean {
  return err instanceof Error && (err.name === 'AbortError' || err.name === 'TimeoutError');
}

interface SarvamErrorBody {
  error?: { message?: string };
  message?: string;
}

function sarvamErrorMessage(data: SarvamErrorBody | null, fallback: string): string {
  return data?.error?.message || data?.message || fallback;
}

export function getSarvamApiKey(): string {
  return (process.env.SARVAM_API_KEY || '').trim();
}

export function isSarvamConfigured(): boolean {
  const key = getSarvamApiKey();
  return Boolean(key && !key.startsWith('your_sarvam'));
}

/**
 * Maps GigSaathi languages ('en' | 'hi' | 'pa') to Sarvam BCP-47 language codes
 */
export function mapLanguageToSarvamCode(lang: SupportedLanguage): string {
  switch (lang) {
    case 'hi':
      return 'hi-IN';
    case 'pa':
      return 'pa-IN';
    case 'en':
    default:
      return 'en-IN';
  }
}

/**
 * Recommended and validated Bulbul TTS speakers for bulbul:v4-flash
 */
export const SARVAM_SPEAKERS: Record<SupportedLanguage, string> = {
  hi: 'sanchita_hi_assistant',
  pa: 'harpreet_pa_narration',
  en: 'aparna_en_companion',
};

export interface SarvamTranscriptionResult {
  transcript: string;
  languageCode?: string;
}

export interface SarvamTtsResult {
  audioBase64: string;
  contentType: string;
}

interface SarvamDocJobStatus {
  status?: string;
  output?: { text?: string };
  documents?: { extracted_text?: string; text?: string }[];
}

export interface ExtractedDocumentFields {
  platformName?: string;
  incidentDate?: string;
  amountDisputed?: number;
  orderIdOrRef?: string;
  deductionReason?: string;
  fullExtractedText: string;
  confidenceNotes: string[];
}

/**
 * 1. Speech-to-Text using Sarvam Saaras model
 * Endpoint: POST /speech-to-text
 */
export async function transcribeAudioWithSarvam(
  audioBuffer: Buffer,
  filename: string,
  language: SupportedLanguage,
  mimeType = 'audio/wav'
): Promise<SarvamTranscriptionResult> {
  const apiKey = getSarvamApiKey();
  if (!apiKey) {
    throw new Error('SARVAM_API_KEY is not configured on the server.');
  }

  const sarvamLang = mapLanguageToSarvamCode(language);
  const formData = new FormData();
  
  // Create a Blob from the audio buffer
  const audioBlob = new Blob([new Uint8Array(audioBuffer) as unknown as BlobPart], { type: mimeType });
  formData.append('file', audioBlob, filename || 'audio.wav');
  formData.append('model', 'saaras:v4');
  formData.append('language_code', sarvamLang);
  formData.append('mode', 'transcribe');

  try {
    const response = await fetch(`${SARVAM_BASE_URL}/speech-to-text`, {
      method: 'POST',
      headers: {
        'api-subscription-key': apiKey,
      },
      body: formData,
      signal: AbortSignal.timeout(STT_TIMEOUT_MS),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(sarvamErrorMessage(data, `Sarvam STT failed with HTTP ${response.status}`));
    }

    return {
      transcript: data.transcript || '',
      languageCode: data.language_code || sarvamLang,
    };
  } catch (err: unknown) {
    if (isAbortOrTimeout(err)) {
      throw new Error('Sarvam Speech-to-Text request timed out. Please try a shorter audio clip.');
    }
    throw err;
  }
}

/**
 * 2. Text-to-Speech using Sarvam Bulbul model
 * Endpoint: POST /text-to-speech
 */
export async function convertTextToSpeechWithSarvam(
  text: string,
  language: SupportedLanguage
): Promise<SarvamTtsResult> {
  const apiKey = getSarvamApiKey();
  if (!apiKey) {
    throw new Error('SARVAM_API_KEY is not configured on the server.');
  }

  const cleanText = text.replace(/[*#_`>]/g, '').trim().slice(0, MAX_TTS_CHARS); // strip markdown and limit
  if (!cleanText) {
    throw new Error('Text to convert into speech cannot be empty.');
  }

  const sarvamLang = mapLanguageToSarvamCode(language);
  const speaker = SARVAM_SPEAKERS[language] || SARVAM_SPEAKERS.en;

  try {
    const response = await fetch(`${SARVAM_BASE_URL}/text-to-speech`, {
      method: 'POST',
      headers: {
        'api-subscription-key': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: cleanText,
        target_language_code: sarvamLang,
        model: 'bulbul:v4-flash',
        speaker,
      }),
      signal: AbortSignal.timeout(TTS_TIMEOUT_MS),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(sarvamErrorMessage(data, `Sarvam TTS failed with HTTP ${response.status}`));
    }

    const audioBase64 = data.audios?.[0] || '';
    if (!audioBase64) {
      throw new Error('Sarvam TTS returned an empty audio stream.');
    }

    return {
      audioBase64,
      contentType: 'audio/wav',
    };
  } catch (err: unknown) {
    if (isAbortOrTimeout(err)) {
      throw new Error('Sarvam Text-to-Speech request timed out.');
    }
    throw err;
  }
}

/**
 * 3. Document Analysis using Sarvam Vision / Document AI
 * Endpoint: POST /doc-ai/v1/job/digitise + GET status polling
 */
export async function analyzeDocumentWithSarvam(
  fileBuffer: Buffer,
  filename: string,
  mimeType: string,
  language: SupportedLanguage
): Promise<ExtractedDocumentFields> {
  const apiKey = getSarvamApiKey();
  if (!apiKey) {
    throw new Error('SARVAM_API_KEY is not configured on the server.');
  }

  const sarvamLang = mapLanguageToSarvamCode(language);
  const fileBlob = new Blob([new Uint8Array(fileBuffer) as unknown as BlobPart], { type: mimeType });
  const formData = new FormData();
  formData.append('file', fileBlob, filename || 'document.png');
  formData.append('language', sarvamLang);
  formData.append('model', 'sarvam-vision-v1');

  // Step 1: Submit Digitise Job
  const submitRes = await fetch(`${SARVAM_BASE_URL}/doc-ai/v1/job/digitise`, {
    method: 'POST',
    headers: {
      'api-subscription-key': apiKey,
    },
    body: formData,
    signal: AbortSignal.timeout(DOC_REQUEST_TIMEOUT_MS),
  });

  const submitData = await submitRes.json();
  if (!submitRes.ok) {
    throw new Error(sarvamErrorMessage(submitData, `Sarvam Document AI submission failed with HTTP ${submitRes.status}`));
  }

  const jobId = submitData.job_id;
  if (!jobId) {
    throw new Error('No job_id returned by Sarvam Document AI.');
  }

  // Step 2: Poll status, bounded by total elapsed time
  let extractedRawText = '';
  const deadline = Date.now() + DOC_POLL_MAX_TOTAL_MS;
  while (Date.now() < deadline) {
    await new Promise((res) => setTimeout(res, DOC_POLL_INTERVAL_MS));

    const remainingMs = Math.max(1, deadline - Date.now());
    let statusRes: Response;
    try {
      statusRes = await fetch(`${SARVAM_BASE_URL}/doc-ai/v1/job/${jobId}/status`, {
        headers: { 'api-subscription-key': apiKey },
        signal: AbortSignal.timeout(Math.min(DOC_REQUEST_TIMEOUT_MS, remainingMs)),
      });
    } catch (err: unknown) {
      if (isAbortOrTimeout(err)) break;
      throw err;
    }

    if (!statusRes.ok) continue;

    const statusData: SarvamDocJobStatus = await statusRes.json();
    if (statusData.status === 'completed' || statusData.status === 'partially_completed') {
      // Try to fetch text from pages or artifacts
      if (statusData.output?.text) {
        extractedRawText = statusData.output.text;
      } else if (Array.isArray(statusData.documents)) {
        extractedRawText = statusData.documents.map((d) => d.extracted_text || d.text || '').join('\n');
      }
      break;
    } else if (statusData.status === 'failed' || statusData.status === 'rejected') {
      throw new Error(`Document analysis job failed with status: ${statusData.status}`);
    }
  }

  // Fallback heuristic regex parser to safely structure candidate fields from extracted text
  const text = extractedRawText || '';
  return extractCandidateFieldsFromText(text);
}

/**
 * Extracts candidate grievance fields (Platform, Amount, Date, Order ID) from document text
 */
export function extractCandidateFieldsFromText(text: string): ExtractedDocumentFields {
  const confidenceNotes: string[] = [];

  // 1. Detect Platform
  let detectedPlatform: string | undefined;
  const platforms = ['Zomato', 'Swiggy', 'Uber', 'Ola', 'Blinkit', 'Zepto', 'Porter', 'Urban Company'];
  for (const p of platforms) {
    if (new RegExp(`\\b${p}\\b`, 'i').test(text)) {
      detectedPlatform = p;
      confidenceNotes.push(`Identified platform brand "${p}" from text.`);
      break;
    }
  }

  // 2. Detect Disputed Amount (e.g. ₹500, Rs. 500, INR 500, Deduction: 500, Penalty: 500)
  let detectedAmount: number | undefined;
  const amountMatch = text.match(/(?:₹|Rs\.?|INR)\s*([0-9]+(?:\.[0-9]{2})?)/i) ||
                      text.match(/(?:deduction|penalty|fine|cut|withheld)\s*[:=-]?\s*(?:₹|Rs\.?)?\s*([0-9]+(?:\.[0-9]{2})?)/i);
  if (amountMatch) {
    detectedAmount = parseFloat(amountMatch[1]);
    confidenceNotes.push(`Identified potential deduction / penalty amount: ₹${detectedAmount}.`);
  }

  // 3. Detect Incident Date (YYYY-MM-DD or DD/MM/YYYY)
  let detectedDate: string | undefined;
  const dateMatch = text.match(/\b([0-9]{4}-[0-9]{2}-[0-9]{2})\b/) ||
                    text.match(/\b([0-9]{1,2}[/-][0-9]{1,2}[/-][0-9]{2,4})\b/);
  if (dateMatch) {
    const rawDate = dateMatch[1];
    if (rawDate.includes('-') && rawDate.length === 10 && rawDate.startsWith('20')) {
      detectedDate = rawDate;
    } else {
      const parts = rawDate.split(/[-/]/);
      if (parts.length === 3) {
        const year = parts[2].length === 2 ? `20${parts[2]}` : parts[2];
        const month = parts[1].padStart(2, '0');
        const day = parts[0].padStart(2, '0');
        detectedDate = `${year}-${month}-${day}`;
      }
    }
    confidenceNotes.push(`Found reference date: ${detectedDate}.`);
  }

  // 4. Detect Order ID / Ref #
  let detectedOrderId: string | undefined;
  const orderMatch = text.match(/(?:Order\s*ID|Trip\s*ID|Ref\s*#?|Txn\s*ID)\s*[:#-]?\s*([A-Za-z0-9_-]{4,20})/i) ||
                     text.match(/#([A-Za-z0-9_-]{5,15})/);
  if (orderMatch) {
    detectedOrderId = orderMatch[1];
    confidenceNotes.push(`Detected Order/Reference ID: ${detectedOrderId}.`);
  }

  // 5. Detect Deduction Reason / Keyword
  let detectedReason: string | undefined;
  const reasonKeywords = ['late delivery', 'customer complaint', 'delay in transit', 'order cancellation', 'rain penalty', 'missed slot', 'speeding'];
  for (const r of reasonKeywords) {
    if (new RegExp(r, 'i').test(text)) {
      detectedReason = r;
      confidenceNotes.push(`Identified penalty trigger: "${r}".`);
      break;
    }
  }

  if (confidenceNotes.length === 0) {
    confidenceNotes.push('No obvious platform deduction pattern found. Please verify fields manually.');
  }

  return {
    platformName: detectedPlatform,
    amountDisputed: detectedAmount,
    incidentDate: detectedDate,
    orderIdOrRef: detectedOrderId,
    deductionReason: detectedReason,
    fullExtractedText: text,
    confidenceNotes,
  };
}
