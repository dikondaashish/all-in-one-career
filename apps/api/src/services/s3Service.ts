/**
 * 🔐 SECURE AWS S3 SERVICE
 * Production-ready S3 service for profile image uploads
 */

import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import sharp from 'sharp';
import { v4 as uuidv4 } from 'uuid';
import { s3Config } from '../config/environment';

const logger = {
  info: (messageOrContext: string | any, message?: string) => {
    if (typeof messageOrContext === 'string') {
      console.log(`📝 S3: ${messageOrContext}`);
    } else {
      console.log(`📝 S3: ${message}`, messageOrContext);
    }
  },
  warn: (message: string) => console.warn(`⚠️ S3: ${message}`),
  error: (contextOrMessage: any, message?: string) => {
    if (typeof contextOrMessage === 'string') {
      console.error(`❌ S3: ${contextOrMessage}`);
    } else {
      console.error(`❌ S3: ${message}`, contextOrMessage);
    }
  }
};

export interface ProfileImageMetadata {
  s3Key: string;
  url: string;
  originalName: string;
  size: number;
  contentType: string;
  userId: string;
  uploadedAt: Date;
}

export interface UploadResult {
  success: boolean;
  data?: ProfileImageMetadata;
  error?: string;
}

export class ProfileImageS3Service {
  private s3Client: S3Client | null = null;
  private config: any = null;
  private isConfigured = false;
  private readonly MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
  private readonly ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

  constructor() {
    this.initializeS3Client();
  }

  private initializeS3Client(): void {
    try {
      if (!s3Config.isConfigured || !s3Config.config) {
        logger.warn('S3 not configured - profile image uploads disabled');
        return;
      }

      this.config = s3Config.config;
      this.s3Client = new S3Client({
        region: this.config.S3_REGION,
        credentials: {
          accessKeyId: this.config.S3_ACCESS_KEY_ID,
          secretAccessKey: this.config.S3_SECRET_ACCESS_KEY,
        },
      });

      this.isConfigured = true;
      logger.info('✅ S3 client initialized successfully');
    } catch (error) {
      logger.error(error, 'Failed to initialize S3 client');
      this.isConfigured = false;
    }
  }

  public isAvailable(): boolean {
    return this.isConfigured && this.s3Client !== null && this.config !== null;
  }

  public async uploadProfileImage(
    userId: string,
    fileBuffer: Buffer,
    originalName: string,
    mimeType: string
  ): Promise<UploadResult> {
    try {
      const validation = this.validateFile(fileBuffer, mimeType);
      if (!validation.valid) {
        return { success: false, error: validation.error || 'Invalid file' };
      }

      if (!this.isAvailable()) {
        return { success: false, error: 'S3 service not available' };
      }

      const processedImage = await this.processImage(fileBuffer);
      const s3Key = this.generateS3Key(userId, originalName);

      const uploadCommand = new PutObjectCommand({
        Bucket: this.config.S3_BUCKET,
        Key: s3Key,
        Body: processedImage.buffer,
        ContentType: processedImage.contentType,
        ServerSideEncryption: 'AES256',
      });

      await this.s3Client!.send(uploadCommand);

      const metadata: ProfileImageMetadata = {
        s3Key,
        url: await this.getSignedUrl(s3Key),
        originalName,
        size: processedImage.buffer.length,
        contentType: processedImage.contentType,
        userId,
        uploadedAt: new Date()
      };

      logger.info({ userId, s3Key, size: metadata.size }, '✅ Image uploaded successfully');
      return { success: true, data: metadata };
    } catch (error) {
      logger.error({ error, userId }, 'Failed to upload image');
      return { success: false, error: error instanceof Error ? error.message : 'Upload failed' };
    }
  }

  public async deleteProfileImage(s3Key: string, userId: string): Promise<boolean> {
    try {
      if (!this.isAvailable()) return false;

      if (!s3Key.includes(`profile-images/${userId}/`)) {
        logger.error({ s3Key, userId }, 'Security violation: Invalid S3 key');
        return false;
      }

      const deleteCommand = new DeleteObjectCommand({
        Bucket: this.config.S3_BUCKET,
        Key: s3Key,
      });

      await this.s3Client!.send(deleteCommand);
      logger.info({ s3Key, userId }, '✅ Image deleted successfully');
      return true;
    } catch (error) {
      logger.error({ error, s3Key, userId }, 'Failed to delete image');
      return false;
    }
  }

  public async getSignedUrl(s3Key: string, expiresIn: number = 3600): Promise<string> {
    if (!this.isAvailable()) throw new Error('S3 service not available');

    const command = new GetObjectCommand({
      Bucket: this.config.S3_BUCKET,
      Key: s3Key,
    });

    return await getSignedUrl(this.s3Client!, command, { expiresIn });
  }

  private validateFile(fileBuffer: Buffer, mimeType: string): { valid: boolean; error?: string } {
    if (fileBuffer.length > this.MAX_FILE_SIZE) {
      return { valid: false, error: 'File size too large. Maximum 5MB allowed.' };
    }
    if (!this.ALLOWED_MIME_TYPES.includes(mimeType)) {
      return { valid: false, error: 'Invalid file type. Only JPEG, PNG, WebP, and GIF allowed.' };
    }
    if (fileBuffer.length === 0) {
      return { valid: false, error: 'File is empty' };
    }
    return { valid: true };
  }

  private async processImage(fileBuffer: Buffer): Promise<{ buffer: Buffer; contentType: string }> {
    try {
      const processedBuffer = await sharp(fileBuffer)
        .resize(512, 512, { fit: 'inside', withoutEnlargement: true })
        .jpeg({ quality: 85 })
        .toBuffer();
      
      return { buffer: processedBuffer, contentType: 'image/jpeg' };
    } catch (error) {
      logger.error(error, 'Image processing failed, using original');
      return { buffer: fileBuffer, contentType: 'image/jpeg' };
    }
  }

  private generateS3Key(userId: string, originalName: string): string {
    const timestamp = Date.now();
    const randomId = uuidv4();
    const sanitizedName = originalName.replace(/[^a-zA-Z0-9.-]/g, '_');
    return `profile-images/${userId}/${timestamp}_${randomId}_${sanitizedName}`;
  }
}

export const profileImageS3Service = new ProfileImageS3Service();
export default profileImageS3Service;