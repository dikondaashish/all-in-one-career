/**
 * Enhanced PDF Service for better text extraction
 * Cloud-compatible fallback for difficult PDFs
 */
export class EnhancedPDFService {
  /**
   * Enhanced PDF text extraction with multiple strategies
   * @param buffer PDF file buffer
   * @returns Extracted text with metadata
   */
  static async extractTextFromPDF(buffer: Buffer): Promise<{ 
    text: string; 
    confidence: number; 
    pageCount: number;
    method: string;
  }> {
    console.info("diag:enhanced_pdf:start", { bufferSize: buffer.length });

    try {
      // Try enhanced pdf-parse with different options
      const pdfParse = (await import('pdf-parse')).default;
      
      // Try with different parsing options
      const parseOptions = [
        { max: 0 }, // Parse all pages
        { max: 10 }, // Limit pages
        { max: 5 } // Further limit for performance
      ];

      for (let i = 0; i < parseOptions.length; i++) {
        try {
          console.time(`diag:enhanced_pdf:attempt_${i + 1}`);
          const data = await pdfParse(buffer, parseOptions[i]);
          console.timeEnd(`diag:enhanced_pdf:attempt_${i + 1}`);
          
          const text = data.text?.trim() || '';
          
          console.info(`diag:enhanced_pdf:attempt_${i + 1}_result`, {
            textLength: text.length,
            pages: data.numpages,
            preview: text.substring(0, 100) + "..."
          });

          if (text && text.length >= 20) {
            return {
              text,
              confidence: 85, // Good confidence for successful parse
              pageCount: data.numpages || 1,
              method: `pdf-parse-enhanced-${i + 1}`
            };
          }
        } catch (attemptError: any) {
          console.warn(`diag:enhanced_pdf:attempt_${i + 1}_failed`, { 
            err: attemptError?.message 
          });
          continue;
        }
      }

      // If all enhanced parsing fails, return empty
      console.warn("diag:enhanced_pdf:all_attempts_failed");
      return {
        text: '',
        confidence: 0,
        pageCount: 0,
        method: 'none'
      };

    } catch (error: any) {
      console.error("diag:enhanced_pdf:error", { 
        err: error?.message, 
        stack: error?.stack 
      });
      throw error;
    }
  }

  /**
   * Check if enhanced PDF parsing is available
   */
  static async isAvailable(): Promise<boolean> {
    try {
      const pdfParse = (await import('pdf-parse')).default;
      return !!pdfParse;
    } catch (error) {
      console.warn("diag:enhanced_pdf:not_available", { err: (error as Error)?.message });
      return false;
    }
  }
}
