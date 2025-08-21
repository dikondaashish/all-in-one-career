import type { PDFDocumentProxy } from 'pdfjs-dist';

/**
 * PDF parsing service with fallback strategies.
 * Primary: pdf-parse (fast, simple)
 * Fallback: pdfjs-dist text extraction (more resilient)
 */

// Lightweight structured error codes for clients
export type PdfErrorCode =
  | 'PDF_UNAVAILABLE'
  | 'PDF_SCANNED'
  | 'PDF_INVALID'
  | 'PDF_PASSWORD'
  | 'PDF_TOO_LARGE'
  | 'PDF_UNKNOWN';

export class PdfParseError extends Error {
  code: PdfErrorCode;
  constructor(code: PdfErrorCode, message: string) {
    super(message);
    this.code = code;
  }
}

// Primary parser (pdf-parse). Use dynamic require to avoid ESM issues in some envs
async function parseWithPdfParse(buffer: Buffer): Promise<string> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const pdfParse = require('pdf-parse');
    const data = await pdfParse(buffer, { max: 0, normalizeWhitespace: true });
    if (!data || !data.text) throw new PdfParseError('PDF_INVALID', 'No text content found');
    return data.text as string;
  } catch (err: any) {
    const msg = String(err?.message || err);
    if (msg.includes('Password') || msg.includes('encrypted')) {
      throw new PdfParseError('PDF_PASSWORD', 'Password-protected PDF');
    }
    if (msg.includes('Invalid PDF') || msg.includes('parsing returned no data')) {
      throw new PdfParseError('PDF_INVALID', 'Invalid or corrupted PDF');
    }
    // bubble up for fallback
    throw new PdfParseError('PDF_UNKNOWN', msg);
  }
}

// Fallback parser (pdfjs-dist) - ESM import
async function parseWithPdfJs(buffer: Buffer): Promise<string> {
  try {
    const pdfjs = await import('pdfjs-dist');
    // @ts-ignore - getDocument is available on default export namespace
    const getDocument = (pdfjs as any).getDocument as (params: any) => { promise: Promise<PDFDocumentProxy> };
    const loadingTask = getDocument({ data: new Uint8Array(buffer) });
    const doc = await loadingTask.promise;
    let text = '';
    const pageCount = doc.numPages || 0;
    for (let i = 1; i <= pageCount; i++) {
      const page = await doc.getPage(i);
      // @ts-ignore
      const content = await page.getTextContent();
      const pageText = (content.items || [])
        .map((item: any) => item?.str)
        .filter(Boolean)
        .join(' ');
      text += pageText + '\n';
    }
    const cleaned = text.replace(/\s+/g, ' ').trim();
    if (cleaned.length < 30) throw new PdfParseError('PDF_SCANNED', 'Likely scanned PDF (no extractable text)');
    return cleaned;
  } catch (err: any) {
    const msg = String(err?.message || err);
    if (msg.includes('Password') || msg.includes('encrypted')) {
      throw new PdfParseError('PDF_PASSWORD', 'Password-protected PDF');
    }
    if (msg.includes('Invalid') || msg.includes('parsing returned no data')) {
      throw new PdfParseError('PDF_INVALID', 'Invalid or corrupted PDF');
    }
    throw new PdfParseError('PDF_UNKNOWN', msg);
  }
}

export interface ParsePdfOptions {
  enableFallback?: boolean; // default true
  timeoutMs?: number; // default 20000 to avoid provider timeouts
}

function withTimeout<T>(p: Promise<T>, ms: number, message: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new PdfParseError('PDF_UNKNOWN', message)), ms);
    p.then((v) => { clearTimeout(t); resolve(v); }, (e) => { clearTimeout(t); reject(e); });
  });
}

export async function extractTextFromPdfService(buffer: Buffer, opts: ParsePdfOptions = {}): Promise<string> {
  const { enableFallback = true, timeoutMs = 20000 } = opts;

  // Try primary
  try {
    return await withTimeout(parseWithPdfParse(buffer), timeoutMs, 'PDF parsing timed out (primary)');
  } catch (primaryErr: any) {
    // If primary failed and fallback is allowed, try fallback
    if (enableFallback) {
      try {
        return await withTimeout(parseWithPdfJs(buffer), timeoutMs, 'PDF parsing timed out (fallback)');
      } catch (fallbackErr) {
        // Prefer specific error code if present
        throw fallbackErr;
      }
    }
    throw primaryErr;
  }
}

export function toClientError(code: PdfErrorCode, message?: string) {
  // Map error code to status and message
  switch (code) {
    case 'PDF_SCANNED':
      return { status: 422, body: { code, message: message || "This PDF appears to be scanned images. Please upload a text-based PDF or DOCX." } };
    case 'PDF_PASSWORD':
      return { status: 400, body: { code, message: message || "Password-protected PDFs are not supported. Please upload an unlocked PDF or DOCX." } };
    case 'PDF_INVALID':
      return { status: 400, body: { code, message: message || "Invalid or corrupted PDF. Please try another file or DOCX." } };
    case 'PDF_TOO_LARGE':
      return { status: 413, body: { code, message: message || "File too large. Maximum size is 10MB." } };
    case 'PDF_UNAVAILABLE':
      return { status: 503, body: { code, message: message || "PDF processing temporarily unavailable. Please try fallback or DOCX." } };
    default:
      return { status: 500, body: { code: 'PDF_UNKNOWN', message: message || "Failed to extract text from PDF." } };
  }
}


