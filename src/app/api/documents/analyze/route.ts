import { NextRequest, NextResponse } from 'next/server';
import {
  analyzeDocumentWithSarvam,
  extractCandidateFieldsFromText,
  isSarvamConfigured,
  normalizeLanguage,
  ExtractedDocumentFields,
} from '@/lib/sarvam';

// Max document upload: 10MB
const MAX_DOC_SIZE_BYTES = 10 * 1024 * 1024;
const ALLOWED_MIME_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'application/pdf'];
const ALLOWED_EXTENSIONS = /\.(png|jpe?g|webp|pdf)$/i;

/** The declared type must be allowed; browsers that send no type must at least use an allowed extension. */
function isAllowedDocument(file: File): boolean {
  const type = file.type.toLowerCase();
  return type ? ALLOWED_MIME_TYPES.includes(type) : ALLOWED_EXTENSIONS.test(file.name);
}

export async function POST(req: NextRequest) {
  if (!isSarvamConfigured()) {
    return NextResponse.json(
      {
        error: 'SARVAM_API_KEY is not configured on the server. Please set SARVAM_API_KEY in .env to enable document analysis.',
        isConfigError: true,
      },
      { status: 503 }
    );
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: 'Invalid upload. Please send the document as multipart form data.' }, { status: 400 });
  }

  const file = formData.get('file');
  const language = normalizeLanguage(formData.get('language'));

  if (!(file instanceof File)) {
    return NextResponse.json(
      { error: 'No document file uploaded. Please upload a screenshot or deduction statement.' },
      { status: 400 }
    );
  }

  if (!isAllowedDocument(file)) {
    return NextResponse.json(
      { error: 'Unsupported file format. Supported formats are PNG, JPEG, WEBP, and PDF.' },
      { status: 400 }
    );
  }

  if (file.size === 0 || file.size > MAX_DOC_SIZE_BYTES) {
    return NextResponse.json(
      { error: file.size === 0 ? 'The uploaded file is empty.' : 'File size exceeds maximum allowable limit of 10MB.' },
      { status: 400 }
    );
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());

    let extracted: ExtractedDocumentFields;
    try {
      extracted = await analyzeDocumentWithSarvam(buffer, file.name, file.type || 'image/png', language);
    } catch (apiErr: unknown) {
      // OCR failed: still return an editable (empty) form so the worker can type the details in.
      console.warn('Sarvam Document AI failed, returning manual-entry fallback:', apiErr instanceof Error ? apiErr.message : apiErr);
      extracted = extractCandidateFieldsFromText('');
      extracted.confidenceNotes = ['We could not read this document automatically. Please fill in the details yourself.'];
    }

    return NextResponse.json({
      success: true,
      filename: file.name,
      fileSize: file.size,
      fields: {
        platformName: extracted.platformName || '',
        amountDisputed: extracted.amountDisputed || null,
        incidentDate: extracted.incidentDate || '',
        orderIdOrRef: extracted.orderIdOrRef || '',
        deductionReason: extracted.deductionReason || '',
      },
      fullExtractedText: extracted.fullExtractedText || '',
      confidenceNotes: extracted.confidenceNotes || [],
    });
  } catch (error: unknown) {
    console.error('Error in /api/documents/analyze:', error);
    return NextResponse.json(
      { error: 'Could not analyse this document right now. Please try again.' },
      { status: 500 }
    );
  }
}
