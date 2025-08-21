import express from 'express';
import multer from 'multer';
import fs from 'fs';
const pdfParse = require('pdf-parse');
import mammoth from 'mammoth';

const router: express.Router = express.Router();

// Configure multer for file uploads
const upload = multer({
  dest: 'uploads/',
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('File type not supported') as any, false);
    }
  }
});

// Text extraction endpoint
router.post('/extract-text', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const filePath = req.file.path;
    const fileType = req.file.mimetype;
    let extractedText = '';

    try {
      switch (fileType) {
        case 'application/pdf':
          extractedText = await extractPDFText(filePath);
          break;
        
        case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
          extractedText = await extractDocxText(filePath);
          break;
        
        case 'application/msword':
          extractedText = await extractDocText(filePath);
          break;
        
        case 'text/plain':
          extractedText = await extractTextFile(filePath);
          break;
        
        default:
          throw new Error('Unsupported file type');
      }

      // Clean up uploaded file
      fs.unlinkSync(filePath);

      res.json({
        success: true,
        text: extractedText,
        filename: req.file.originalname,
        size: req.file.size,
        type: fileType
      });

    } catch (extractionError) {
      // Clean up uploaded file even if extraction fails
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      throw extractionError;
    }

  } catch (error) {
    console.error('File extraction error:', error);
    res.status(500).json({
      message: 'Failed to extract text from file',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Helper functions for file extraction
async function extractPDFText(filePath: string): Promise<string> {
  const buffer = fs.readFileSync(filePath);
  const data = await pdfParse(buffer);
  return data.text;
}

async function extractDocxText(filePath: string): Promise<string> {
  const result = await mammoth.extractRawText({ path: filePath });
  return result.value;
}

async function extractDocText(filePath: string): Promise<string> {
  // For older .doc files, you might need a different library
  // For now, return an error message
  throw new Error('Legacy .doc files not supported. Please convert to .docx format.');
}

async function extractTextFile(filePath: string): Promise<string> {
  return fs.readFileSync(filePath, 'utf-8');
}

export default router;