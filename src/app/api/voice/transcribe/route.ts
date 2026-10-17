import { NextRequest, NextResponse } from 'next/server';
import { transcribeAudioWithSarvam, isSarvamConfigured } from '@/lib/sarvam';
import { SupportedLanguage } from '@/types';

// Max file size: 10MB
const MAX_AUDIO_SIZE_BYTES = 10 * 1024 * 1024;

export async function POST(req: NextRequest) {
  try {
    if (!isSarvamConfigured()) {
      return NextResponse.json(
        {
          error: 'SARVAM_API_KEY is not configured on the server. Please set SARVAM_API_KEY in .env to enable speech-to-text.',
          isConfigError: true,
        },
        { status: 503 }
      );
    }

    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const language = (formData.get('language') as SupportedLanguage) || 'hi';

    if (!file) {
      return NextResponse.json(
        { error: 'No audio file provided in request.' },
        { status: 400 }
      );
    }

    if (file.size > MAX_AUDIO_SIZE_BYTES) {
      return NextResponse.json(
        { error: 'Audio file is too large. Maximum supported size is 10MB.' },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const result = await transcribeAudioWithSarvam(buffer, file.name || 'audio.wav', language);

    return NextResponse.json({
      transcript: result.transcript,
      languageCode: result.languageCode,
      language,
    });
  } catch (error: any) {
    console.error('Error in /api/voice/transcribe:', error.message);
    return NextResponse.json(
      { error: `Transcription Error: ${error.message}` },
      { status: 500 }
    );
  }
}
