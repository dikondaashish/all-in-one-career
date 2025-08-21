import express, { Router } from 'express';
import multer from 'multer';
import { extractTextFromPdf, extractTextFromDocx, extractTextFromTxt } from '../utils/fileParser';

const router: Router = express.Router();

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
      cb(new Error('Only PDF, DOC, DOCX, and TXT files are supported'));
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
        extractedText = await extractTextFromPdf(file.buffer);
        break;
      case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
      case 'application/msword':
        extractedText = await extractTextFromDocx(file.buffer);
        break;
      case 'text/plain':
        extractedText = await extractTextFromTxt(file.buffer);
        break;
      default:
        return res.status(415).json({ 
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
        return res.status(413).json({ error: 'File too large. Maximum size is 10MB.' });
      }
      return res.status(400).json({ error: error.message });
    }
    
    // Handle specific PDF errors
    if (error.message.includes('scanned images') || error.message.includes('PDF_SCANNED')) {
      return res.status(422).json({ 
        error: 'This PDF appears to be scanned images. OCR isn\'t enabled yet. Please upload a text-based PDF or DOCX.' 
      });
    }
    
    res.status(500).json({ 
      error: 'Failed to extract text from file. Please try again or use a different file.' 
    });
  }
});



export default router;
