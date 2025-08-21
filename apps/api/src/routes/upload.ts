import express from 'express';
import multer from 'multer';
import mammoth from 'mammoth';
import pdfParse from 'pdf-parse';
import path from 'path';

const router = express.Router();

// Configure multer for file uploads
const upload = multer({ 
  limits: { 
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword',
      'text/plain'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF, DOC, DOCX, and TXT files are supported'), false);
    }
  },
  storage: multer.memoryStorage() // Store in memory for processing
});

// POST /api/upload/extract-text - Extract text from uploaded files
router.post('/extract-text', upload.single('file'), async (req: any, res) => {
  try {
    const file = req.file;
    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    console.log(`Processing file: ${file.originalname} (${file.mimetype})`);

    let extractedText = '';

    switch (file.mimetype) {
      case 'application/pdf':
        extractedText = await extractFromPdf(file.buffer);
        break;
      case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
      case 'application/msword':
        extractedText = await extractFromWord(file.buffer);
        break;
      case 'text/plain':
        extractedText = file.buffer.toString('utf-8');
        break;
      default:
        return res.status(400).json({ 
          error: 'Unsupported file type. Only PDF, DOC, DOCX, and TXT files are supported.' 
        });
    }

    // Basic validation
    if (!extractedText || extractedText.trim().length === 0) {
      return res.status(400).json({ 
        error: 'No text could be extracted from the file. Please ensure the file contains readable text.' 
      });
    }

    if (extractedText.length < 50) {
      return res.status(400).json({ 
        error: 'Extracted text is too short. Please upload a complete resume.' 
      });
    }

    console.log(`Successfully extracted ${extractedText.length} characters from ${file.originalname}`);

    res.json({ 
      text: extractedText,
      filename: file.originalname,
      size: file.size,
      type: file.mimetype,
      wordCount: extractedText.split(/\s+/).length,
      extractedAt: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('File processing error:', error);
    
    if (error instanceof multer.MulterError) {
      if (error.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ error: 'File too large. Maximum size is 10MB.' });
      }
      return res.status(400).json({ error: error.message });
    }
    
    res.status(500).json({ 
      error: 'Failed to extract text from file. Please try again or use a different file.' 
    });
  }
});

/**
 * Extract text from PDF files using pdf-parse
 */
const extractFromPdf = async (buffer: Buffer): Promise<string> => {
  try {
    const data = await pdfParse(buffer);
    
    if (!data.text || data.text.trim().length === 0) {
      throw new Error('No text found in PDF. The file might be image-based or corrupted.');
    }
    
    // Clean up the text - remove excessive whitespace and normalize line breaks
    const cleanedText = data.text
      .replace(/\s+/g, ' ') // Replace multiple spaces with single space
      .replace(/\n\s*\n/g, '\n') // Remove empty lines
      .trim();
    
    console.log(`PDF extraction successful: ${data.numpages} pages, ${cleanedText.length} characters`);
    
    return cleanedText;
  } catch (error: any) {
    console.error('PDF extraction error:', error);
    
    if (error.message?.includes('No text found')) {
      throw error;
    }
    
    throw new Error('Failed to extract text from PDF. Please ensure the file is not corrupted and contains readable text (not just images).');
  }
};

/**
 * Extract text from Word documents using mammoth
 */
const extractFromWord = async (buffer: Buffer): Promise<string> => {
  try {
    const result = await mammoth.extractRawText({ buffer });
    
    if (result.messages && result.messages.length > 0) {
      console.log('Mammoth extraction messages:', result.messages);
    }
    
    return result.value;
  } catch (error) {
    console.error('Word extraction error:', error);
    throw new Error('Failed to extract text from Word document. Please ensure the file is not corrupted.');
  }
};

export default router;
