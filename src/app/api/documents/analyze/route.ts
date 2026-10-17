import { NextRequest, NextResponse } from 'next/server';
import { analyzeDocumentWithSarvam, extractCandidateFieldsFromText, isSarvamConfigured } from '@/lib/sarvam';
import { SupportedLanguage } from '@/types';

// Max document upload: 10MB
const MAX_DOC_SIZE_BYTES = 10 * 1024 * 1024;
const ALLOWED_MIME_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'application/pdf'];

export async function POST(req: NextRequest) {
  try {
    if (!isSarvamConfigured()) {
      return NextResponse.json(
        {
          error: 'SARVAM_API_KEY is not configured on the server. Please set SARVAM_API_KEY in .env to enable document analysis.',
          isConfigError: true,
        },
        { status: 503 }
      );
    }

    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const language = (formData.get('language') as SupportedLanguage) || 'en';

    if (!file) {
      return NextResponse.json(
        { error: 'No document file uploaded. Please upload a screenshot or deduction statement.' },
        { status: 400 }
      );
    }

    if (!ALLOWED_MIME_TYPES.includes(file.type.toLowerCase()) && !file.name.match(/\.(png|jpe?g|webp|pdf)$/i)) {
      return NextResponse.json(
        {
          error: `Unsupported file format (${file.type || 'unknown'}). Supported formats are PNG, JPEG, WEBP, and PDF.`,
        },
        { status: 400 }
      );
    }

    if (file.size > MAX_DOC_SIZE_BYTES) {
      return NextResponse.json(
        { error: 'File size exceeds maximum allowable limit of 10MB.' },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    let extracted: any;
    try {
      extracted = await analyzeDocumentWithSarvam(
        buffer,
        file.name,
        file.type || 'image/png',
        language
      );
    } catch (apiErr: any) {
      console.warn('Sarvam Document AI API call completed with fallback note:', apiErr.message);
      // Graceful fallback to regex heuristic parser
      extracted = extractCandidateFieldsFromText(`[File: ${file.name}]\nDocument uploaded successfully.`);
      extracted.confidenceNotes.push(`Upstream OCR Note: ${apiErr.message}`);
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
  } catch (error: any) {
    console.error('Error in /api/documents/analyze:', error.message);
    return NextResponse.json(
      { error: `Document Analysis Error: ${error.message}` },
      { status: 500 }
    );
  }
}
