// Shrinks large screenshots in the browser before upload: phone screenshots are often 2-5MB,
// which is slow on mobile data and unnecessary for reading text. PDFs and small files pass through.
const COMPRESSIBLE_TYPES = ['image/png', 'image/jpeg', 'image/webp'];
const MIN_BYTES_TO_COMPRESS = 500 * 1024;
const MAX_DIMENSION = 2000; // keeps small receipt text legible for OCR
const JPEG_QUALITY = 0.85;

export function shouldCompress(file: Pick<File, 'type' | 'size'>): boolean {
  return COMPRESSIBLE_TYPES.includes(file.type) && file.size >= MIN_BYTES_TO_COMPRESS;
}

/** Scales (width, height) down to fit within `max` on the longest side, keeping aspect ratio. */
export function fitWithin(width: number, height: number, max = MAX_DIMENSION): { width: number; height: number } {
  const scale = Math.min(1, max / Math.max(width, height));
  return { width: Math.round(width * scale), height: Math.round(height * scale) };
}

export async function compressImageForUpload(file: File): Promise<File> {
  if (!shouldCompress(file) || typeof createImageBitmap === 'undefined') return file;
  try {
    const bitmap = await createImageBitmap(file);
    const { width, height } = fitWithin(bitmap.width, bitmap.height);
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    canvas.getContext('2d')?.drawImage(bitmap, 0, 0, width, height);
    bitmap.close();

    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', JPEG_QUALITY));
    // Keep the original if compression would not actually help.
    if (!blob || blob.size >= file.size) return file;
    return new File([blob], file.name.replace(/\.\w+$/, '.jpg'), { type: 'image/jpeg' });
  } catch {
    return file;
  }
}
