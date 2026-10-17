import { NextRequest, NextResponse } from 'next/server';
import { transcribeAudioWithSarvam, isSarvamConfigured, normalizeLanguage } from '@/lib/sarvam';

// Max file size: 10MB
const MAX_AUDIO_SIZE_BYTES = 10 * 1024 * 1024;
// Browsers record webm/ogg (Chrome, Firefox) or mp4 (Safari); uploads may be wav/mpeg.
const ALLOWED_AUDIO_TYPES = ['audio/webm', 'audio/ogg', 'audio/wav', 'audio/x-wav', 'audio/wave', 'audio/mpeg', 'audio/mp3', 'audio/mp4', 'audio/x-m4a', 'audio/aac', 'video/webm'];

function isAllowedAudio(file: File): boolean {
  // MediaRecorder types can carry codec parameters, e.g. "audio/webm;codecs=opus".
  const baseType = file.type.split(';')[0].trim().toLowerCase();
  return !baseType || ALLOWED_AUDIO_TYPES.includes(baseType);
}

export async function POST(req: NextRequest) {
  if (!isSarvamConfigured()) {
    return NextResponse.json(
      {
        error: 'SARVAM_API_KEY is not configured on the server. Please set SARVAM_API_KEY in .env to enable speech-to-text.',
        isConfigError: true,
      },
      { status: 503 }
    );
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: 'Invalid upload. Please send the audio as multipart form data.' }, { status: 400 });
  }

  const file = formData.get('file');
  const language = normalizeLanguage(formData.get('language'), 'hi');

  if (!(file instanceof File)) {
    return NextResponse.json(
      { error: 'No audio file provided in request.' },
      { status: 400 }
    );
  }

  if (!isAllowedAudio(file)) {
    return NextResponse.json(
      { error: 'Unsupported audio format. Please record again or upload WEBM, OGG, WAV, MP3 or M4A audio.' },
      { status: 400 }
    );
  }

  if (file.size === 0 || file.size > MAX_AUDIO_SIZE_BYTES) {
    return NextResponse.json(
      { error: file.size === 0 ? 'The audio recording is empty.' : 'Audio file is too large. Maximum supported size is 10MB.' },
      { status: 400 }
    );
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const result = await transcribeAudioWithSarvam(buffer, file.name || 'audio.wav', language, file.type || 'audio/wav');

    return NextResponse.json({
      transcript: result.transcript,
      languageCode: result.languageCode,
      language,
    });
  } catch (error: unknown) {
    console.error('Error in /api/voice/transcribe:', error);
    return NextResponse.json(
      { error: 'Could not transcribe the audio right now. Please try again.' },
      { status: 502 }
    );
  }
}
