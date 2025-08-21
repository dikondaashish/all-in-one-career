import pdfParse from 'pdf-parse';
import * as mammoth from 'mammoth';

export type Extracted = { text: string; meta: { mime: string; bytes: number; pages?: number } };

export async function extractTextFromFile(mime: string, originalName: string, buf: Buffer): Promise<Extracted> {
  const base = { mime, bytes: buf.byteLength };

  const isPDF  = mime === 'application/pdf' || originalName.toLowerCase().endsWith('.pdf');
  const isDOCX = mime === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
              || originalName.toLowerCase().endsWith('.docx');
  const isTXT  = mime.startsWith('text/') || originalName.toLowerCase().endsWith('.txt');
  const isDOC  = mime === 'application/msword' || originalName.toLowerCase().endsWith('.doc');

  if (isPDF) {
    const parsed = await pdfParse(buf).catch((err: any) => {
      const msg = String(err?.message || err);
      if (msg.toLowerCase().includes('password')) {
        const e: any = new Error('PDF is password-protected. Please unlock it and try again.');
        e.code = 'PDF_PASSWORD';
        throw e;
      }
      throw err;
    });
    const text = (parsed.text || '').trim();
    return { text, meta: { ...base, pages: parsed.numpages } };
  }

  if (isDOCX) {
    const { value } = await mammoth.extractRawText({ buffer: buf });
    return { text: (value || '').trim(), meta: base };
  }

  if (isTXT) {
    return { text: buf.toString('utf8').trim(), meta: base };
  }

  if (isDOC) {
    // Keep MVP simple; DOC often needs native converters.
    throw new Error('Legacy .doc files are not supported reliably. Please save as DOCX or PDF.');
  }

  throw new Error(`Unsupported file type: ${mime}. Please upload PDF, DOCX or TXT.`);
}