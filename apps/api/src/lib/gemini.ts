import { GoogleGenerativeAI } from '@google/generative-ai';

// Use environment variable or fallback to hardcoded key
const apiKey = process.env.GEMINI_API_KEY || "AIzaSyBJvkuDo6TC2GXfulO12R7uhfoJG-p73d8";
if (!apiKey) throw new Error('GEMINI_API_KEY missing');

export const genAI = new GoogleGenerativeAI(apiKey);

export async function geminiGenerate(
  modelName: string,
  systemInstruction: string,
  userPrompt: string
) {
  const model = genAI.getGenerativeModel({
    model: modelName,
    systemInstruction,
  });
  const res = await model.generateContent(userPrompt);
  const text = res.response?.text() ?? '';
  return text.trim();
}

/**
 * Extract text from PDF using Gemini Vision AI with OCR capabilities
 * This handles both regular PDFs and scanned/image-based PDFs
 */
export async function extractPdfTextWithGemini(buffer: Buffer): Promise<string> {
  try {
    console.info("diag:gemini:start", { bufferSize: buffer.length });
    
    // Check if API key is available
    if (!apiKey || apiKey.length < 20) {
      console.warn("diag:gemini:no_api_key");
      throw new Error("Gemini API key not available");
    }
    
    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash-exp", // Latest experimental model for best performance
      systemInstruction: `You are an expert document text extractor. Extract ALL text from this PDF document.

RULES:
1. Extract ALL visible text exactly as written
2. Include names, contact info, dates, skills, experience, education
3. Preserve spacing and line breaks
4. Handle both digital text and scanned images
5. Return only the text content, no analysis
6. If unclear text exists, include what you can read clearly

Extract everything accurately.`
    });

    // Convert buffer to base64 for Gemini
    const base64Data = buffer.toString('base64');
    
    const result = await model.generateContent([
      {
        inlineData: {
          mimeType: 'application/pdf',
          data: base64Data
        }
      },
      "Extract all text from this document using OCR if needed. Be thorough and accurate."
    ]);

    const extractedText = result.response?.text()?.trim() || '';
    
    console.info("diag:gemini:result", { 
      textLength: extractedText.length,
      preview: extractedText.substring(0, 150) + "...",
      hasContent: extractedText.length > 50,
      isOcrResult: true
    });

    // More lenient validation for OCR results
    if (extractedText.length < 10) {
      console.warn("diag:gemini:insufficient_ocr_response", { length: extractedText.length });
      return '';
    }

    // Only check for explicit failure messages
    const criticalErrors = ['cannot process', 'error occurred', 'failed to'];
    const hasCriticalErrors = criticalErrors.some(pattern => 
      extractedText.toLowerCase().includes(pattern)
    );

    if (hasCriticalErrors) {
      console.warn("diag:gemini:critical_error_detected");
      return '';
    }

    console.info("diag:gemini:ocr_success", { 
      extractedLength: extractedText.length,
      wordCount: extractedText.split(/\s+/).length
    });

    return extractedText;
  } catch (error: any) {
    console.error("diag:gemini:ocr_error", { 
      err: error?.message, 
      stack: error?.stack 
    });
    
    // Try fallback with stable model if experimental fails
    try {
      console.warn("diag:gemini:trying_fallback_model");
      const fallbackModel = genAI.getGenerativeModel({
        model: "gemini-1.5-pro",
        systemInstruction: "Extract all text from this PDF document."
      });
      
      const base64Data = buffer.toString('base64');
      const fallbackResult = await fallbackModel.generateContent([
        {
          inlineData: {
            mimeType: 'application/pdf',
            data: base64Data
          }
        },
        "Extract all text."
      ]);
      
      const fallbackText = fallbackResult.response?.text()?.trim() || '';
      
      if (fallbackText && fallbackText.length >= 10) {
        console.info("diag:gemini:fallback_success", { textLen: fallbackText.length });
        return fallbackText;
      }
    } catch (fallbackError: any) {
      console.error("diag:gemini:fallback_failed", { err: fallbackError?.message });
    }
    
    // Don't throw error, just return empty to allow other fallbacks
    return '';
  }
}
