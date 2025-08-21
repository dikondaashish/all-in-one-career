import * as mammoth from 'mammoth';
// IMPORTANT: use the legacy build that works in Node (ESM for TypeScript compatibility)
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';

export type Extracted = { text: string; meta: { mime: string; bytes: number; pages?: number } };

export async function extractTextFromFile(mime: string, originalName: string, buf: Buffer): Promise<Extracted> {
  const base = { mime, bytes: buf.byteLength };

  const lower = originalName.toLowerCase();
  const isPDF  = mime === 'application/pdf' || lower.endsWith('.pdf');
  const isDOCX = mime === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || lower.endsWith('.docx');
  const isTXT  = mime.startsWith('text/') || lower.endsWith('.txt');
  const isDOC  = mime === 'application/msword' || lower.endsWith('.doc');

  if (isPDF) {
    try {
      // Avoid worker & font/FS quirks in server environments like Render
      // NOTE: text extraction does NOT require canvas.
      const loadingTask = pdfjsLib.getDocument({
        data: new Uint8Array(buf),
        // Server-safe options (TypeScript may not know all options)
        useSystemFonts: false,
        verbosity: 0
      } as any);

      const pdf = await loadingTask.promise;
      let parts: string[] = [];
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        // content.items contains TextItem objects with .str
        const pageText = (content.items as any[])
          .map((it) => (typeof it?.str === 'string' ? it.str : ''))
          .filter(Boolean)
          .join(' ');
        parts.push(pageText);
      }
      const text = parts.join('\n').trim();

      // cleanup to be nice in long-lived processes
      try { await pdf.cleanup(); } catch {}
      try { await loadingTask.destroy(); } catch {}

      return { text, meta: { ...base, pages: pdf.numPages } };
    } catch (err: any) {
      const msg = String(err?.message || err);
      if (msg.toLowerCase().includes('password') || msg.toLowerCase().includes('encrypted')) {
        const e: any = new Error('PDF is password-protected. Please unlock it and try again.');
        e.code = 'PDF_PASSWORD';
        throw e;
      }
      throw err;
    }
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