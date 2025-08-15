/**
 * PDF parsing utility that avoids startup file loading issues
 * Uses dynamic import to prevent pdf-parse from trying to load test files during startup
 */

export interface PDFParseResult {
  text: string;
  numpages: number;
  info: any;
  metadata: any;
  version: string;
}

export async function parsePDF(buffer: Buffer): Promise<PDFParseResult> {
  try {
    // Dynamic import to avoid startup issues with pdf-parse
    const pdfParse = (await import('pdf-parse')).default as (buffer: Buffer) => Promise<PDFParseResult>;
    const result = await pdfParse(buffer);
    return result;
  } catch (error) {
    console.error('Error parsing PDF:', error);
    throw new Error('Failed to parse PDF content');
  }
}

export async function extractTextFromPDF(buffer: Buffer): Promise<string> {
  try {
    const result = await parsePDF(buffer);
    return result.text;
  } catch (error) {
    console.error('Error extracting text from PDF:', error);
    throw new Error('Failed to extract text from PDF');
  }
}
