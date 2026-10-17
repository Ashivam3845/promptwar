import { NextRequest, NextResponse } from 'next/server';
import { convertTextToSpeechWithSarvam, isSarvamConfigured, normalizeLanguage, MAX_TTS_CHARS } from '@/lib/sarvam';
import { LruCache } from '@/lib/lruCache';

// The same answer (e.g. a cached chat reply) is often played by many users: synthesise it once.
const speechCache = new LruCache<{ audio: Uint8Array; contentType: string }>(50, 24 * 60 * 60 * 1000);

// Raw audio bytes are ~25% smaller than base64-in-JSON and need no decoding on the client.
function audioResponse(audio: Uint8Array, contentType: string, cacheStatus: 'HIT' | 'MISS') {
  return new Response(new Blob([audio as BlobPart], { type: contentType }), {
    headers: {
      'Content-Type': contentType,
      'Cache-Control': 'private, max-age=86400',
      'X-Speech-Cache': cacheStatus,
    },
  });
}

export async function POST(req: NextRequest) {
  if (!isSarvamConfigured()) {
    return NextResponse.json(
      {
        error: 'SARVAM_API_KEY is not configured on the server. Please set SARVAM_API_KEY in .env to enable text-to-speech.',
        isConfigError: true,
      },
      { status: 503 }
    );
  }

  let body: { text?: unknown; language?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  const { text } = body ?? {};
  const language = normalizeLanguage(body?.language, 'hi');

  if (typeof text !== 'string' || !text.trim()) {
    return NextResponse.json(
      { error: 'Field "text" is required and cannot be empty.' },
      { status: 400 }
    );
  }

  if (text.length > MAX_TTS_CHARS) {
    return NextResponse.json(
      { error: `Text too long for single speech conversion. Maximum length is ${MAX_TTS_CHARS.toLocaleString('en-IN')} characters.` },
      { status: 400 }
    );
  }

  const cacheKey = `${language}:${text.trim()}`;
  const cached = speechCache.get(cacheKey);
  if (cached) {
    return audioResponse(cached.audio, cached.contentType, 'HIT');
  }

  try {
    const result = await convertTextToSpeechWithSarvam(text, language);
    const audio = new Uint8Array(Buffer.from(result.audioBase64, 'base64'));
    speechCache.set(cacheKey, { audio, contentType: result.contentType });
    return audioResponse(audio, result.contentType, 'MISS');
  } catch (error: unknown) {
    console.error('Error in /api/voice/speak:', error);
    return NextResponse.json(
      { error: 'Could not generate speech right now. Please try again.' },
      { status: 502 }
    );
  }
}
