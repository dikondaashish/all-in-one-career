import express from 'express';
import multer from 'multer';
import { extractTextFromFile } from '../lib/extractText';

const router: express.Router = express.Router();

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
      cb(null as any, true);
    } else {
      cb(new Error('Unsupported file type. Only PDF, DOC, DOCX, and TXT files are supported.') as any);
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

    // Use the unified text extraction utility
    const { text: extractedText } = await extractTextFromFile(
      file.mimetype, 
      file.originalname, 
      file.buffer
    );

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

  } catch (error: unknown) {
    console.error('File processing error:', error);
    
    const err = error as Error;
    res.status(500).json({ 
      error: 'Failed to process file', 
      message: err.message || 'Unknown error occurred'
    });
  }
});

export default router;