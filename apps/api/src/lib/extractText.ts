import * as pdfjs from 'pdfjs-dist/legacy/build/pdf.mjs';
import * as mammoth from 'mammoth';

export type Extracted = { 
  text: string; 
  meta: { 
    mime: string; 
    bytes: number; 
    pages?: number 
  } 
};

export async function extractTextFromFile(mime: string, originalName: string, buf: Buffer): Promise<Extracted> {
  const base = { mime, bytes: buf.byteLength };
  
  // Normalize MIME for common Office types
  const isPDF  = mime === 'application/pdf' || originalName.toLowerCase().endsWith('.pdf');
  const isDOCX = mime === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
              || originalName.toLowerCase().endsWith('.docx');
  const isTXT  = mime.startsWith('text/') || originalName.toLowerCase().endsWith('.txt');
  const isDOC  = mime === 'application/msword' || originalName.toLowerCase().endsWith('.doc');

  if (isPDF) {
    try {
      // Convert Buffer to Uint8Array for pdfjs
      const uint8Array = new Uint8Array(buf);
      
      // Load the PDF document
      const pdf = await pdfjs.getDocument({
        data: uint8Array,
        useSystemFonts: true
      }).promise;
      
      let fullText = '';
      
      // Extract text from all pages
      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const textContent = await page.getTextContent();
        
        // Combine text items with spaces
        interface TextItem {
          str?: string;
        }
        
        const pageText = textContent.items
          .map((item: unknown) => {
            const textItem = item as TextItem;
            return textItem.str || '';
          })
          .join(' ');
        
        fullText += pageText + '\n';
      }
      
      const text = fullText.trim();
      return { text, meta: { ...base, pages: pdf.numPages } };
    } catch (err: any) {
      // Surface a friendlier error for locked PDFs
      const msg = String(err?.message || err);
      if (msg.toLowerCase().includes('password')) {
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
    // Minimal fallback: many .doc files won't parse reliably without native deps.
    // For MVP, tell user to resave as DOCX or TXT if parse fails.
    throw new Error('Legacy .doc files are not supported reliably. Please save as DOCX or PDF.');
  }

  throw new Error(`Unsupported file type: ${mime}. Please upload PDF, DOCX or TXT.`);
}
