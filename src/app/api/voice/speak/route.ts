import { NextRequest, NextResponse } from 'next/server';
import { convertTextToSpeechWithSarvam, isSarvamConfigured } from '@/lib/sarvam';
import { SupportedLanguage } from '@/types';

export async function POST(req: NextRequest) {
  try {
    if (!isSarvamConfigured()) {
      return NextResponse.json(
        {
          error: 'SARVAM_API_KEY is not configured on the server. Please set SARVAM_API_KEY in .env to enable text-to-speech.',
          isConfigError: true,
        },
        { status: 503 }
      );
    }

    const body = await req.json();
    const { text, language = 'hi' } = body;

    if (!text || typeof text !== 'string' || !text.trim()) {
      return NextResponse.json(
        { error: 'Field "text" is required and cannot be empty.' },
        { status: 400 }
      );
    }

    if (text.length > 2500) {
      return NextResponse.json(
        { error: 'Text too long for single speech conversion. Maximum length is 2,500 characters.' },
        { status: 400 }
      );
    }

    const result = await convertTextToSpeechWithSarvam(text, language as SupportedLanguage);

    return NextResponse.json({
      audioBase64: result.audioBase64,
      contentType: result.contentType,
      language,
    });
  } catch (error: any) {
    console.error('Error in /api/voice/speak:', error.message);
    return NextResponse.json(
      { error: `Text-to-Speech Error: ${error.message}` },
      { status: 500 }
    );
  }
}
