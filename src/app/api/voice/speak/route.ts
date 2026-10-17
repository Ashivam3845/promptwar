import { NextRequest, NextResponse } from 'next/server';
import { convertTextToSpeechWithSarvam, isSarvamConfigured, normalizeLanguage, MAX_TTS_CHARS } from '@/lib/sarvam';

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

  try {
    const result = await convertTextToSpeechWithSarvam(text, language);
    return NextResponse.json({
      audioBase64: result.audioBase64,
      contentType: result.contentType,
      language,
    });
  } catch (error: unknown) {
    console.error('Error in /api/voice/speak:', error);
    return NextResponse.json(
      { error: 'Could not generate speech right now. Please try again.' },
      { status: 502 }
    );
  }
}
