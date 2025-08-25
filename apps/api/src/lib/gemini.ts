import { GoogleGenerativeAI, GenerationConfig, SafetySetting, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';

// Use environment variable or fallback to hardcoded key
const apiKey = process.env.GEMINI_API_KEY || "AIzaSyBJvkuDo6TC2GXfulO12R7uhfoJG-p73d8";
if (!apiKey) throw new Error('GEMINI_API_KEY missing');

export const genAI = new GoogleGenerativeAI(apiKey);

// Model priorities for fallback
const MODEL_PRIORITIES = [
  "gemini-2.0-pro-exp",
  "gemini-2.0-flash-exp", 
  "gemini-1.5-pro-latest",
  "gemini-1.5-flash"
];

// Default safety settings for JSON generation
const DEFAULT_SAFETY_SETTINGS: SafetySetting[] = [
  {
    category: HarmCategory.HARM_CATEGORY_HARASSMENT,
    threshold: HarmBlockThreshold.BLOCK_NONE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
    threshold: HarmBlockThreshold.BLOCK_NONE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
    threshold: HarmBlockThreshold.BLOCK_NONE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
    threshold: HarmBlockThreshold.BLOCK_NONE,
  },
];

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
 * Get the best available Gemini model with fallback
 * @param preferredModel Optional preferred model
 * @returns Model name
 */
export function getModel(preferredModel?: string): string {
  if (preferredModel) {
    return preferredModel;
  }
  
  // Return the first priority model (latest available)
  return MODEL_PRIORITIES[0] || "gemini-1.5-flash";
}

/**
 * Generate JSON-only response with retry and validation
 * @param prompt The prompt text
 * @param safety Optional safety settings
 * @param maxRetries Maximum number of retries
 * @returns Parsed JSON object
 */
export async function generateJson<T = any>(
  prompt: string, 
  safety: SafetySetting[] = DEFAULT_SAFETY_SETTINGS,
  maxRetries: number = 3
): Promise<T> {
  const model = getModel();
  console.log(`🤖 Using Gemini model: ${model} for JSON generation`);
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const generativeModel = genAI.getGenerativeModel({
        model,
        generationConfig: {
          temperature: 0.1,
          topK: 1,
          topP: 0.1,
          maxOutputTokens: 8192,
          responseMimeType: "application/json"
        },
        safetySettings: safety,
        systemInstruction: "You are a JSON-only response system. Return ONLY valid JSON. No prose, no markdown, no explanation."
      });

      const result = await generativeModel.generateContent(prompt);
      const response = result.response;
      
      if (!response) {
        throw new Error("No response from Gemini");
      }
      
      const text = response.text().trim();
      
      // Validate JSON
      try {
        const parsed = JSON.parse(text);
        console.log(`✅ JSON generation successful on attempt ${attempt}`);
        return parsed as T;
      } catch (parseError) {
        console.warn(`⚠️ JSON parse failed on attempt ${attempt}:`, parseError);
        console.warn(`Raw response: ${text.substring(0, 200)}...`);
        
        if (attempt === maxRetries) {
          throw new Error(`Failed to generate valid JSON after ${maxRetries} attempts`);
        }
      }
    } catch (error) {
      console.error(`❌ Gemini request failed on attempt ${attempt}:`, error);
      
      if (attempt === maxRetries) {
        throw new Error(`Gemini generation failed after ${maxRetries} attempts: ${error}`);
      }
      
      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
    }
  }
  
  throw new Error("Unexpected error in generateJson");
}

/**
 * Generate JSON with fallback model strategy
 * @param prompt The prompt text
 * @param safety Optional safety settings
 * @returns Parsed JSON object
 */
export async function generateJsonWithFallback<T = any>(
  prompt: string,
  safety: SafetySetting[] = DEFAULT_SAFETY_SETTINGS
): Promise<T> {
  for (const modelName of MODEL_PRIORITIES) {
    try {
      console.log(`🔄 Trying model: ${modelName}`);
      
      const generativeModel = genAI.getGenerativeModel({
        model: modelName,
        generationConfig: {
          temperature: 0.1,
          topK: 1,
          topP: 0.1,
          maxOutputTokens: 8192,
          responseMimeType: "application/json"
        },
        safetySettings: safety,
        systemInstruction: "You are a JSON-only response system. Return ONLY valid JSON. No prose, no markdown, no explanation."
      });

      const result = await generativeModel.generateContent(prompt);
      const response = result.response;
      
      if (!response) {
        continue;
      }
      
      const text = response.text().trim();
      const parsed = JSON.parse(text);
      
      console.log(`✅ Success with model: ${modelName}`);
      return parsed as T;
    } catch (error) {
      console.warn(`⚠️ Model ${modelName} failed:`, error);
      continue;
    }
  }
  
  throw new Error("All Gemini models failed to generate valid JSON");
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
