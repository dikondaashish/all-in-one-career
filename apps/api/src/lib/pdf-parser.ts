// apps/api/src/lib/pdf-parser.ts
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";

/**
 * Extract plain text and basic stats from a PDF buffer.
 * Works in Node without DOM. No worker, no canvas.
 */
export async function extractPdfText(buffer: Buffer) {
  try {
    console.info("pdfjs: Starting PDF text extraction", { bufferSize: buffer.length });
    
    // Load the PDF from in-memory buffer
    const loadingTask = pdfjsLib.getDocument({ 
      data: buffer,
      verbosity: 0 // Reduce verbose logging
    });
    const pdf = await loadingTask.promise;
    
    console.info("pdfjs: PDF loaded successfully", { numPages: pdf.numPages });

    let text = "";
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      try {
        const page = await pdf.getPage(pageNum);
        const content = await page.getTextContent();
        
        // Join text items into a line; keep spaces
        const pageText = content.items
          .map((item: any) => ("str" in item ? item.str : ""))
          .join(" ");
        text += pageText + "\n";
        
        console.info(`pdfjs: Extracted page ${pageNum}`, { 
          pageTextLength: pageText.length,
          totalLength: text.length 
        });
      } catch (pageError: any) {
        console.error(`pdfjs: Failed to extract page ${pageNum}`, { 
          error: pageError?.message 
        });
        // Continue with other pages
      }
    }

    const cleaned = text.replace(/\u0000/g, "").trim();
    const isLikelyScanned = cleaned.length < 30 && pdf.numPages > 0;
    
    console.info("pdfjs: Text extraction completed", {
      totalPages: pdf.numPages,
      extractedLength: cleaned.length,
      isLikelyScanned,
      preview: cleaned.substring(0, 100)
    });

    return {
      text: cleaned,
      numPages: pdf.numPages,
      isLikelyScanned,
    };
  } catch (error: any) {
    console.error("pdfjs: PDF extraction failed", {
      error: error?.message,
      stack: error?.stack,
      name: error?.name
    });
    throw error;
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