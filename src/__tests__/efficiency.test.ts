import { describe, it, expect, afterEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { LruCache } from '../lib/lruCache';
import { selectRelevantSchemes, buildSchemeContext } from '../lib/schemeRetrieval';
import { VERIFIED_SCHEMES } from '../lib/schemes';
import { shouldCompress, fitWithin } from '../lib/imageCompression';
import { POST as speakHandler } from '../app/api/voice/speak/route';

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe('LruCache', () => {
  it('evicts the least recently used entry when full', () => {
    const cache = new LruCache<number>(2, 60_000);
    cache.set('a', 1);
    cache.set('b', 2);
    expect(cache.get('a')).toBe(1); // "a" is now most recent
    cache.set('c', 3);
    expect(cache.get('b')).toBeUndefined();
    expect(cache.get('a')).toBe(1);
    expect(cache.get('c')).toBe(3);
    expect(cache.size).toBe(2);
  });

  it('expires entries after their time to live', () => {
    vi.useFakeTimers();
    const cache = new LruCache<string>(10, 1_000);
    cache.set('k', 'v');
    vi.advanceTimersByTime(999);
    expect(cache.get('k')).toBe('v');
    vi.advanceTimersByTime(2);
    expect(cache.get('k')).toBeUndefined();
  });
});

describe('scheme retrieval for the chat prompt', () => {
  it('picks the schemes that match the question', () => {
    const pension = selectRelevantSchemes('How do I get a monthly pension after 60?');
    expect(pension[0].id).toBe('pmsym-pension');

    const health = selectRelevantSchemes('hospital treatment cashless health cover');
    expect(health.map((s) => s.id)).toContain('pmjay-ayushman-bharat');
  });

  it('matches word variants and Hindi questions', () => {
    const deduction = selectRelevantSchemes('Platform deducted 500 rupees unfairly, what can I do?');
    expect(deduction[0].id).toBe('national-consumer-helpline');
    expect(selectRelevantSchemes('मुझे पेंशन चाहिए')[0].id).toBe('pmsym-pension');
  });

  it('falls back to a small default set when nothing matches', () => {
    const fallback = selectRelevantSchemes('zzzz qqqq');
    expect(fallback.length).toBeGreaterThan(0);
    expect(fallback.length).toBeLessThan(VERIFIED_SCHEMES.length);
  });

  it('never returns more than the limit', () => {
    expect(selectRelevantSchemes('scheme worker benefits insurance pension health', 2)).toHaveLength(2);
  });

  it('sends a far smaller, single-language context than the full list', () => {
    const picked = selectRelevantSchemes('accident insurance e-Shram card');
    const context = buildSchemeContext(picked, 'hi');
    const fullList = JSON.stringify(VERIFIED_SCHEMES, null, 2);

    expect(context.length).toBeLessThan(fullList.length / 2);
    expect(context).toContain(picked[0].summary.hi);
    expect(context).not.toContain(picked[0].summary.pa);
    expect(context).not.toContain(picked[0].summary.en);
  });
});

describe('upload image compression rules', () => {
  it('only compresses large screenshots, never PDFs or small images', () => {
    expect(shouldCompress({ type: 'image/png', size: 3 * 1024 * 1024 })).toBe(true);
    expect(shouldCompress({ type: 'image/png', size: 100 * 1024 })).toBe(false);
    expect(shouldCompress({ type: 'application/pdf', size: 5 * 1024 * 1024 })).toBe(false);
  });

  it('scales down to fit while keeping the aspect ratio, and never upscales', () => {
    expect(fitWithin(1080, 4000)).toEqual({ width: 540, height: 2000 });
    expect(fitWithin(800, 600)).toEqual({ width: 800, height: 600 });
  });
});

describe('speech synthesis endpoint', () => {
  it('returns raw audio and serves repeated text from cache without calling Sarvam again', async () => {
    vi.stubEnv('SARVAM_API_KEY', 'test-key');
    const wavBytes = Buffer.from('RIFF....WAVEfmt ');
    const fetchMock = vi.fn(async () =>
      new Response(JSON.stringify({ audios: [wavBytes.toString('base64')] }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    );
    vi.stubGlobal('fetch', fetchMock);

    const request = () =>
      new NextRequest('http://localhost:3000/api/voice/speak', {
        method: 'POST',
        body: JSON.stringify({ text: 'Cache me once', language: 'hi' }),
      });

    const first = await speakHandler(request());
    expect(first.status).toBe(200);
    expect(first.headers.get('content-type')).toMatch(/^audio\//);
    expect(first.headers.get('x-speech-cache')).toBe('MISS');
    expect(Buffer.from(await first.arrayBuffer()).equals(wavBytes)).toBe(true);

    const second = await speakHandler(request());
    expect(second.headers.get('x-speech-cache')).toBe('HIT');
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
