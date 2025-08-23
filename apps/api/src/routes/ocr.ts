import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../middleware/auth';
import { textractService } from '../services/textractService';
import pino from 'pino';

const router: Router = Router();
const prisma = new PrismaClient();
const logger = pino();

/**
 * Start OCR processing for a PDF file
 * POST /api/ats/ocr/start
 */
router.post('/start', authenticateToken, async (req: any, res) => {
  try {
    const { s3Key, scanId, fileBuffer, filename } = req.body;
    const userId = req.user?.uid || req.user?.id;

    if ((!s3Key && !fileBuffer) || !userId) {
      return res.status(400).json({
        ok: false,
        error: 'Missing required fields: (s3Key or fileBuffer) and userId'
      });
    }

    if (!textractService.isAvailable()) {
      return res.status(503).json({
        ok: false,
        error: 'OCR service not available. Check AWS configuration.'
      });
    }

    console.info('diag:ocr:start_requested', { 
      userId: userId, 
      s3Key: s3Key, 
      hasFileBuffer: !!fileBuffer,
      scanId: scanId 
    });

    let finalS3Key = s3Key;
    
    // If we don't have an S3 key but have file buffer, upload to S3 first
    if (!finalS3Key && fileBuffer) {
      try {
        // Create a simple S3 upload for OCR documents
        const { S3Client, PutObjectCommand } = await import('@aws-sdk/client-s3');
        
        if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY || !process.env.AWS_REGION || !process.env.S3_BUCKET) {
          return res.status(503).json({
            ok: false,
            error: 'AWS S3 configuration not available for OCR'
          });
        }

        const s3Client = new S3Client({
          region: process.env.AWS_REGION,
          credentials: {
            accessKeyId: process.env.AWS_ACCESS_KEY_ID,
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
          },
        });

        const buffer = Buffer.from(fileBuffer, 'base64');
        const timestamp = Date.now();
        finalS3Key = `ocr-documents/${userId}/${timestamp}_${filename || 'document.pdf'}`;

        const uploadCommand = new PutObjectCommand({
          Bucket: process.env.S3_BUCKET,
          Key: finalS3Key,
          Body: buffer,
          ContentType: 'application/pdf',
          ServerSideEncryption: 'AES256',
        });

        await s3Client.send(uploadCommand);
        console.info('diag:ocr:s3_upload_success', { s3Key: finalS3Key });

      } catch (s3Error: any) {
        console.error('diag:ocr:s3_upload_failed', { err: s3Error?.message });
        return res.status(500).json({
          ok: false,
          error: 'Failed to upload file for OCR processing'
        });
      }
    }

    // Check if there's already a running or completed job for this S3 key
    const existingJob = await prisma.ocrJob.findFirst({
      where: {
        s3Key: finalS3Key,
        userId: userId,
        status: {
          in: ['queued', 'running', 'succeeded']
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    if (existingJob) {
      if (existingJob.status === 'succeeded' && existingJob.extractedText) {
        console.info('diag:ocr:reusing_completed', { jobId: existingJob.id });
        return res.status(200).json({
          ok: true,
          jobId: existingJob.id,
          status: 'succeeded',
          text: existingJob.extractedText
        });
      }

      if (existingJob.status === 'running' || existingJob.status === 'queued') {
        console.info('diag:ocr:reusing_running', { jobId: existingJob.id });
        return res.status(202).json({
          ok: true,
          jobId: existingJob.id
        });
      }
    }

    // Create new OCR job record
    const ocrJob = await prisma.ocrJob.create({
      data: {
        userId: userId,
        scanId: scanId || null,
        s3Key: finalS3Key,
        status: 'queued',
        filename: req.body.filename || filename || null,
      }
    });

    console.info('diag:ocr:job_created', { jobId: ocrJob.id });

    // Start Textract job
    try {
      const textractJobId = await textractService.startDocumentTextDetection(finalS3Key);
      
      if (!textractJobId) {
        await prisma.ocrJob.update({
          where: { id: ocrJob.id },
          data: {
            status: 'failed',
            error: 'Failed to start Textract job'
          }
        });

        return res.status(500).json({
          ok: false,
          error: 'Failed to start OCR processing'
        });
      }

      // Update job with Textract job ID
      await prisma.ocrJob.update({
        where: { id: ocrJob.id },
        data: {
          status: 'running',
          textractJobId: textractJobId
        }
      });

      console.info('diag:ocr:textract_started', { 
        jobId: ocrJob.id, 
        textractJobId: textractJobId 
      });

      return res.status(202).json({
        ok: true,
        jobId: ocrJob.id
      });

    } catch (textractError: any) {
      console.error('diag:ocr:textract_start_failed', { 
        jobId: ocrJob.id, 
        err: textractError?.message 
      });

      await prisma.ocrJob.update({
        where: { id: ocrJob.id },
        data: {
          status: 'failed',
          error: textractError?.message || 'Textract start failed'
        }
      });

      return res.status(500).json({
        ok: false,
        error: 'Failed to start OCR processing'
      });
    }

  } catch (error: any) {
    console.error('diag:ocr:start_error', { err: error?.message });
    return res.status(500).json({
      ok: false,
      error: 'Internal server error'
    });
  }
});

/**
 * Get OCR processing status
 * GET /api/ats/ocr/status?jobId=<id>
 */
router.get('/status', authenticateToken, async (req: any, res) => {
  try {
    const { jobId } = req.query;
    const userId = req.user?.uid || req.user?.id;

    if (!jobId || !userId) {
      return res.status(400).json({
        status: 'failed',
        error: 'Missing jobId parameter'
      });
    }

    // Find the OCR job
    const ocrJob = await prisma.ocrJob.findFirst({
      where: {
        id: jobId as string,
        userId: userId
      }
    });

    if (!ocrJob) {
      return res.status(404).json({
        status: 'failed',
        error: 'OCR job not found'
      });
    }

    console.info('diag:ocr:status_check', { 
      jobId: jobId, 
      currentStatus: ocrJob.status 
    });

    // If job is already completed, return result
    if (ocrJob.status === 'succeeded') {
      return res.status(200).json({
        status: 'succeeded',
        text: ocrJob.extractedText || '',
        filename: ocrJob.filename
      });
    }

    if (ocrJob.status === 'failed') {
      return res.status(200).json({
        status: 'failed',
        error: ocrJob.error || 'OCR processing failed'
      });
    }

    if (ocrJob.status === 'queued') {
      return res.status(200).json({
        status: 'running'
      });
    }

    // If job is running, check Textract status
    if (ocrJob.status === 'running' && ocrJob.textractJobId) {
      try {
        const textractResult = await textractService.getDocumentTextDetection(ocrJob.textractJobId);

        if (textractResult.status === 'IN_PROGRESS') {
          return res.status(200).json({
            status: 'running'
          });
        }

        if (textractResult.status === 'SUCCEEDED') {
          // Update job with extracted text
          await prisma.ocrJob.update({
            where: { id: ocrJob.id },
            data: {
              status: 'succeeded',
              extractedText: textractResult.text || '',
              updatedAt: new Date()
            }
          });

          console.info('diag:ocr:completed', { 
            jobId: jobId, 
            textLength: textractResult.text?.length || 0 
          });

          return res.status(200).json({
            status: 'succeeded',
            text: textractResult.text || '',
            filename: ocrJob.filename
          });
        }

        if (textractResult.status === 'FAILED') {
          // Update job as failed
          await prisma.ocrJob.update({
            where: { id: ocrJob.id },
            data: {
              status: 'failed',
              error: textractResult.error || 'Textract processing failed',
              updatedAt: new Date()
            }
          });

          console.error('diag:ocr:textract_failed', { 
            jobId: jobId, 
            error: textractResult.error 
          });

          return res.status(200).json({
            status: 'failed',
            error: textractResult.error || 'OCR processing failed'
          });
        }

      } catch (textractError: any) {
        console.error('diag:ocr:textract_check_failed', { 
          jobId: jobId, 
          err: textractError?.message 
        });

        // Update job as failed
        await prisma.ocrJob.update({
          where: { id: ocrJob.id },
          data: {
            status: 'failed',
            error: textractError?.message || 'Failed to check Textract status',
            updatedAt: new Date()
          }
        });

        return res.status(200).json({
          status: 'failed',
          error: 'Failed to check OCR status'
        });
      }
    }

    // Default to running if status is unclear
    return res.status(200).json({
      status: 'running'
    });

  } catch (error: any) {
    console.error('diag:ocr:status_error', { err: error?.message });
    return res.status(500).json({
      status: 'failed',
      error: 'Internal server error'
    });
  }
});

export default router;
