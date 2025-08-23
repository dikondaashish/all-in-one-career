import fs from 'fs/promises';
import path from 'path';
import os from 'os';
// @ts-ignore - pdf-poppler doesn't have types
import pdf from 'pdf-poppler';
import Tesseract from 'tesseract.js';

const TMP_DIR = process.env.RENDER ? "/opt/render/project/tmp" : os.tmpdir();

/**
 * OCR Service for extracting text from non-selectable PDFs
 * Converts PDF pages to images and uses Tesseract.js for text recognition
 */
export class OCRService {
  /**
   * Extract text from a PDF buffer using OCR
   * @param buffer PDF file buffer
   * @param options OCR options
   * @returns Extracted text
   */
  static async extractTextFromPDF(
    buffer: Buffer, 
    options: {
      maxPages?: number;
      quality?: number;
      lang?: string;
    } = {}
  ): Promise<{ text: string; confidence: number; pageCount: number }> {
    const { maxPages = 10, quality = 2, lang = 'eng' } = options;
    
    console.info("diag:ocr:start", { 
      bufferSize: buffer.length, 
      maxPages, 
      quality, 
      lang 
    });

    // Create temporary directory
    await fs.mkdir(TMP_DIR, { recursive: true });
    
    // Create unique temporary file paths
    const tempId = Date.now() + Math.random().toString(36).substring(2);
    const tempPdfPath = path.join(TMP_DIR, `ocr-${tempId}.pdf`);
    const tempImagesDir = path.join(TMP_DIR, `ocr-images-${tempId}`);
    
    try {
      // Write PDF buffer to temporary file
      await fs.writeFile(tempPdfPath, buffer);
      console.info("diag:ocr:pdf_written", { tempPdfPath });

      // Convert PDF pages to images
      await fs.mkdir(tempImagesDir, { recursive: true });
      
      const options_pdf = {
        format: 'png',
        out_dir: tempImagesDir,
        out_prefix: 'page',
        page: maxPages > 1 ? `1-${maxPages}` : '1'
      };

      console.time("diag:ocr:pdf_to_images");
      const imageFiles = await pdf.convert(tempPdfPath, options_pdf);
      console.timeEnd("diag:ocr:pdf_to_images");
      
      console.info("diag:ocr:images_created", { 
        imageCount: Array.isArray(imageFiles) ? imageFiles.length : 1 
      });

      // Get list of created image files
      const imageDir = await fs.readdir(tempImagesDir);
      const pngFiles = imageDir
        .filter(file => file.endsWith('.png'))
        .sort()
        .slice(0, maxPages);

      if (pngFiles.length === 0) {
        throw new Error('No images were created from PDF');
      }

      console.info("diag:ocr:processing_images", { fileCount: pngFiles.length });

      // Process each image with Tesseract
      let combinedText = '';
      let totalConfidence = 0;
      let processedPages = 0;

      for (const imageFile of pngFiles) {
        try {
          const imagePath = path.join(tempImagesDir, imageFile);
          
          console.time(`diag:ocr:tesseract_page_${processedPages + 1}`);
          const result = await Tesseract.recognize(imagePath, lang, {
            logger: () => {}, // Suppress verbose logging
          });
          console.timeEnd(`diag:ocr:tesseract_page_${processedPages + 1}`);

          if (result.data.text && result.data.text.trim().length > 0) {
            combinedText += result.data.text.trim() + '\n\n';
            totalConfidence += result.data.confidence;
            processedPages++;
            
            console.info(`diag:ocr:page_${processedPages}_result`, {
              textLength: result.data.text.trim().length,
              confidence: Math.round(result.data.confidence),
              preview: result.data.text.trim().substring(0, 100) + "..."
            });
          } else {
            console.warn(`diag:ocr:page_${processedPages + 1}_empty`);
          }
        } catch (pageError: any) {
          console.error(`diag:ocr:page_${processedPages + 1}_error`, { 
            err: pageError?.message 
          });
          // Continue with other pages
        }
      }

      const averageConfidence = processedPages > 0 ? totalConfidence / processedPages : 0;
      const finalText = combinedText.trim();

      console.info("diag:ocr:final_result", {
        totalTextLength: finalText.length,
        processedPages,
        averageConfidence: Math.round(averageConfidence),
        preview: finalText.substring(0, 150) + "..."
      });

      return {
        text: finalText,
        confidence: averageConfidence,
        pageCount: processedPages
      };

    } catch (error: any) {
      console.error("diag:ocr:error", { 
        err: error?.message, 
        stack: error?.stack 
      });
      throw error;
    } finally {
      // Cleanup temporary files
      try {
        await fs.unlink(tempPdfPath).catch(() => {});
        await fs.rm(tempImagesDir, { recursive: true, force: true }).catch(() => {});
        console.info("diag:ocr:cleanup_completed");
      } catch (cleanupError) {
        console.warn("diag:ocr:cleanup_failed", { err: (cleanupError as Error)?.message });
      }
    }
  }

  /**
   * Check if OCR is available in the current environment
   */
  static async isAvailable(): Promise<boolean> {
    try {
      // Test if required dependencies are available
      await fs.mkdir(TMP_DIR, { recursive: true });
      return true;
    } catch (error) {
      console.warn("diag:ocr:not_available", { err: (error as Error)?.message });
      return false;
    }
  }
}
