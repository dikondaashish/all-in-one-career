import express, { Router } from 'express';
import multer from 'multer';
import { extractTextFromDocx, extractTextFromTxt } from '../utils/fileParser';
import { extractTextFromPdfService, PdfParseError, toClientError } from '../services/pdfParser';

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
      cb(new Error('Only PDF, DOC, DOCX, and TXT files are supported.'));
    }
  },
  storage: multer.memoryStorage() // Store in memory for processing
});

// POST /api/upload/extract-text - Extract text from uploaded files
router.post('/extract-text', upload.single('file'), async (req: any, res) => {
  try {
    const file = req.file;
    if (!file) {
      return res.status(400).json({ code: 'NO_FILE', message: 'No file uploaded' });
    }

    console.log(`Processing file: ${file.originalname} (${file.mimetype})`);

    let extractedText = '';

    switch (file.mimetype) {
      case 'application/pdf': {
        const useFallback = req.query.fallback === 'true';
        try {
          // 20s cap to avoid provider timeouts
          extractedText = await extractTextFromPdfService(file.buffer, { enableFallback: useFallback, timeoutMs: 20000 });
        } catch (e: any) {
          const err = e as PdfParseError;
          const mapped = toClientError((err.code as any) || 'PDF_UNKNOWN', err.message);
          return res.status(mapped.status).json(mapped.body);
        }
        break;
      }
      case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
      case 'application/msword':
        extractedText = await extractTextFromDocx(file.buffer);
        break;
      case 'text/plain':
        extractedText = await extractTextFromTxt(file.buffer);
        break;
      default:
        return res.status(415).json({ code: 'UNSUPPORTED_TYPE', message: 'Unsupported file type. Only PDF, DOC, DOCX, and TXT files are supported.' });
    }

    // Basic validation
    if (!extractedText || extractedText.trim().length === 0) {
      return res.status(400).json({ code: 'NO_TEXT', message: 'No text could be extracted from the file. Please ensure the file contains readable text.' });
    }

    if (extractedText.length < 50) {
      return res.status(400).json({ code: 'TEXT_TOO_SHORT', message: 'Extracted text is too short. Please upload a complete resume.' });
    }

    console.log(`Successfully extracted ${extractedText.length} characters from ${file.originalname}`);

    res.json({ 
      code: 'OK',
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
        return res.status(413).json({ code: 'FILE_TOO_LARGE', message: 'File too large. Maximum size is 10MB.' });
      }
      return res.status(400).json({ code: 'UPLOAD_ERROR', message: error.message });
    }
    
    // Structured fallback error
    res.status(500).json({ code: 'SERVER_ERROR', message: 'Failed to extract text from file. Please try again or use a different file.' });
  }
});

// GET /api/upload/pdf-status - Check PDF parsing status
router.get('/pdf-status', async (req, res) => {
  try {
    // Light-weight status for readiness probes
    res.json({
      available: true,
      timestamp: new Date().toISOString(),
      nodeVersion: process.version,
      platform: process.platform
    });
    
  } catch (error: any) {
    console.error('PDF status check failed:', error);
    res.status(500).json({
      available: false,
      error: 'Status check failed',
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

export default router;
