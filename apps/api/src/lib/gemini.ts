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
 * Generate JSON-only response with retry and validation for v2 features
 */
export async function askGeminiJSON(prompt: string, model: "pro" | "flash" = "pro", maxRetries: number = 3) {
  const modelName = model === "pro" ? "gemini-2.0-flash-exp" : "gemini-2.0-flash-exp"; // Use 2.0 for both
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const geminiModel = genAI.getGenerativeModel({
        model: modelName,
        systemInstruction: "You are a JSON-only response system. Return ONLY valid JSON. No prose, no markdown, no explanation."
      });
      
      const result = await geminiModel.generateContent(prompt);
      const text = result.response.text().trim();
      
      // Ensure JSON by extracting JSON from response
      const start = text.indexOf("{");
      const end = text.lastIndexOf("}");
      
      if (start === -1 || end === -1) {
        throw new Error("No JSON found in response");
      }
      
      const jsonText = text.slice(start, end + 1);
      const parsed = JSON.parse(jsonText);
      
      console.log(`✅ Gemini JSON generation successful on attempt ${attempt}`);
      return parsed;
    } catch (error) {
      console.warn(`⚠️ Gemini JSON attempt ${attempt} failed:`, error);
      
      if (attempt === maxRetries) {
        console.error(`❌ All ${maxRetries} attempts failed, using fallback`);
        // Return a basic fallback structure
        return {
          error: "Failed to generate JSON response",
          fallback: true,
          attempt: attempt
        };
      }
      
      // Wait before retry with exponential backoff
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
    }
  }
}

/**
 * Extract text from PDF using Gemini Vision AI
 * This handles complex PDFs that traditional parsers can't read
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
      model: "gemini-2.0-flash-exp", // Use latest Gemini 2.0 model for better performance
      systemInstruction: `Extract ALL text from this PDF. Return only the text content, no analysis.`
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
      "Extract all text from this document."
    ]);

    const extractedText = result.response?.text()?.trim() || '';
    
    console.info("diag:gemini:result", { 
      textLength: extractedText.length,
      preview: extractedText.substring(0, 100) + "...",
      hasContent: extractedText.length > 20
    });

    // Basic validation - return empty if response is too short or looks like an error
    if (extractedText.length < 20 || 
        extractedText.toLowerCase().includes('cannot') ||
        extractedText.toLowerCase().includes('unable') ||
        extractedText.toLowerCase().includes('error')) {
      console.warn("diag:gemini:insufficient_response");
      return '';
    }

    return extractedText;
  } catch (error: any) {
    console.error("diag:gemini:error", { 
      err: error?.message, 
      stack: error?.stack 
    });
    // Don't throw error, just return empty to allow other fallbacks
    return '';
  }
}
