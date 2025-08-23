// apps/api/src/lib/pdf-parser.ts
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";

/**
 * Extract plain text and basic stats from a PDF buffer.
 * Works in Node without DOM. No worker, no canvas.
 */
export async function extractPdfText(buffer: Buffer) {
  // Load the PDF from in-memory buffer
  const loadingTask = pdfjsLib.getDocument({ data: buffer });
  const pdf = await loadingTask.promise;

  let text = "";
  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const content = await page.getTextContent();
    // Join text items into a line; keep spaces
    const pageText = content.items
      .map((item: any) => ("str" in item ? item.str : ""))
      .join(" ");
    text += pageText + "\n";
  }

  const cleaned = text.replace(/\u0000/g, "").trim();
  const isLikelyScanned = cleaned.length < 30 && pdf.numPages > 0;

  return {
    text: cleaned,
    numPages: pdf.numPages,
    isLikelyScanned, // hint to offer OCR path (optional)
  };
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