// apps/api/src/lib/pdf-parser.ts
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";

/**
 * Extract plain text and basic stats from a PDF buffer.
 * Works in Node without DOM. No worker, no canvas.
 */
export async function extractPdfText(buffer: Buffer) {
  try {
    // Load the PDF from in-memory buffer with additional options
    const loadingTask = pdfjsLib.getDocument({ 
      data: buffer,
      disableFontFace: true,
      verbosity: 0 // Reduce console noise
    });
    const pdf = await loadingTask.promise;

    console.info("diag:pdfjs:loaded", { numPages: pdf.numPages });

    let text = "";
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      try {
        const page = await pdf.getPage(pageNum);
        const content = await page.getTextContent();
        
        // More robust text extraction
        const pageText = content.items
          .filter((item: any) => item && typeof item === 'object' && 'str' in item)
          .map((item: any) => item.str || "")
          .filter(str => str.trim().length > 0)
          .join(" ");
        
        if (pageText.trim()) {
          text += pageText + "\n";
          console.info(`diag:pdfjs:page${pageNum}`, { chars: pageText.length });
        }
      } catch (pageErr: any) {
        console.warn(`diag:pdfjs:page${pageNum}:error`, { err: pageErr?.message });
        // Continue with other pages
      }
    }

    const cleaned = text.replace(/\u0000/g, "").replace(/\s+/g, " ").trim();
    const isLikelyScanned = cleaned.length < 30 && pdf.numPages > 0;

    console.info("diag:pdfjs:final", { 
      totalChars: cleaned.length, 
      isLikelyScanned,
      preview: cleaned.substring(0, 100) + "..."
    });

    return {
      text: cleaned,
      numPages: pdf.numPages,
      isLikelyScanned,
    };
  } catch (loadErr: any) {
    console.error("diag:pdfjs:load_error", { err: loadErr?.message, stack: loadErr?.stack });
    throw loadErr;
  }
}

/**
 * Legacy function for backward compatibility.
 * Extracts text from a PDF file path.
 */
export async function extractTextFromPDF(filePath: string): Promise<string> {
  const fs = await import('fs');
  const buffer = fs.readFileSync(filePath);
  const result = await extractPdfText(buffer);
  return result.text;
}