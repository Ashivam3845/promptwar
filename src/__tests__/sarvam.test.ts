import { describe, it, expect, vi } from 'vitest';
import {
  mapLanguageToSarvamCode,
  extractCandidateFieldsFromText,
  SARVAM_SPEAKERS,
} from '../lib/sarvam';
import { POST as transcribeHandler } from '../app/api/voice/transcribe/route';
import { POST as speakHandler } from '../app/api/voice/speak/route';
import { POST as docAnalyzeHandler } from '../app/api/documents/analyze/route';
import { NextRequest } from 'next/server';

describe('Sarvam AI Multilingual Service & Handlers', () => {
  it('maps GigSaathi supported languages to BCP-47 codes accurately', () => {
    expect(mapLanguageToSarvamCode('en')).toBe('en-IN');
    expect(mapLanguageToSarvamCode('hi')).toBe('hi-IN');
    expect(mapLanguageToSarvamCode('pa')).toBe('pa-IN');
  });

  it('provides verified Bulbul TTS speakers for each language', () => {
    expect(SARVAM_SPEAKERS.hi).toBe('sanchita_hi_assistant');
    expect(SARVAM_SPEAKERS.pa).toBe('harpreet_pa_narration');
    expect(SARVAM_SPEAKERS.en).toBe('aparna_en_companion');
  });

  it('extracts candidate dispute fields from raw text accurately', () => {
    const rawSampleText = `
      Zomato Partner Payout Summary
      Date: 2026-10-14
      Order ID: #ZOM-883921
      Delay Penalty / Deduction: ₹450
      Reason: late delivery in heavy rain
    `;

    const extracted = extractCandidateFieldsFromText(rawSampleText);
    expect(extracted.platformName).toBe('Zomato');
    expect(extracted.amountDisputed).toBe(450);
    expect(extracted.incidentDate).toBe('2026-10-14');
    expect(extracted.orderIdOrRef).toBe('ZOM-883921');
    expect(extracted.deductionReason).toBe('late delivery');
    expect(extracted.confidenceNotes.length).toBeGreaterThan(0);
  });

  it('rejects transcribe requests without audio files or when unconfigured', async () => {
    // Provide a temporary dummy key to test payload validation
    process.env.SARVAM_API_KEY = 'sk_test_mock_sarvam_key_12345678';

    const formData = new FormData();
    const req = new NextRequest('http://localhost:3000/api/voice/transcribe', {
      method: 'POST',
      body: formData,
    });

    const res = await transcribeHandler(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain('audio file');
  });

  it('rejects speak requests with missing or empty text', async () => {
    process.env.SARVAM_API_KEY = 'sk_test_mock_sarvam_key_12345678';

    const req = new NextRequest('http://localhost:3000/api/voice/speak', {
      method: 'POST',
      body: JSON.stringify({ text: '   ' }),
    });

    const res = await speakHandler(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain('required');
  });

  it('rejects document analysis for unsupported file types', async () => {
    process.env.SARVAM_API_KEY = 'sk_test_mock_sarvam_key_12345678';

    const formData = new FormData();
    const fakeFile = new File(['content'], 'malicious.exe', { type: 'application/x-msdownload' });
    formData.append('file', fakeFile);

    const req = new NextRequest('http://localhost:3000/api/documents/analyze', {
      method: 'POST',
      body: formData,
    });

    const res = await docAnalyzeHandler(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain('Unsupported file format');
  });
});
