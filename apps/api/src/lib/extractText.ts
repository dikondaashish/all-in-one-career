import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';
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
    try {
      const loadingTask = pdfjsLib.getDocument({
        data: buf,
        useSystemFonts: true,
        verbosity: 0
      });
      const pdf = await loadingTask.promise;
      
      let fullText = '';
      const numPages = pdf.numPages;
      
      for (let pageNum = 1; pageNum <= numPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
          .map((item: any) => item.str)
          .join(' ');
        fullText += pageText + ' ';
      }
      
      pdf.destroy();
      const text = fullText.trim();
      return { text, meta: { ...base, pages: numPages } };
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