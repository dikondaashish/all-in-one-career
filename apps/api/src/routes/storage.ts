import { Router } from 'express';
import type { PrismaClient } from '@prisma/client';
import type pino from 'pino';
import multer from 'multer';
import { z } from 'zod';

const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

export default function storageRouter(_prisma: PrismaClient, _logger: pino.Logger): Router {
  const r = Router();

  const UploadBody = z.object({
    fileName: z.string(),
    fileType: z.string(),
    folder: z.string().optional().default('uploads')
  });

  r.post('/upload', upload.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      const { fileName, fileType, folder } = UploadBody.parse(req.body);
      
      // For now, return success with file info
      // In production, this would upload to S3 or Firebase Storage
      const fileInfo = {
        originalName: req.file.originalname,
        fileName: fileName,
        fileType: fileType,
        size: req.file.size,
        folder: folder,
        uploadedAt: new Date().toISOString(),
        // In production, this would be the actual file URL
        url: `https://storage.example.com/${folder}/${fileName}`
      };

      res.json({ 
        success: true, 
        file: fileInfo,
        message: 'File uploaded successfully (mock response)'
      });
    } catch (error) {
      console.error('Upload error:', error);
      res.status(500).json({ error: 'Failed to upload file' });
    }
  });

  r.get('/files/:folder', async (req, res) => {
    try {
      const { folder } = req.params;
      
      // Mock response - in production this would list files from storage
      const files = [
        {
          name: 'sample-resume.pdf',
          url: `https://storage.example.com/${folder}/sample-resume.pdf`,
          size: 1024000,
          uploadedAt: new Date().toISOString()
        }
      ];

      res.json({ files });
    } catch (error) {
      console.error('List files error:', error);
      res.status(500).json({ error: 'Failed to list files' });
    }
  });

  return r;
}
