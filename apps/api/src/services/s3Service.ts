/**
 * 🔐 SECURE AWS S3 SERVICE
 * 
 * Professional S3 service implementation with security-first approach.
 * Handles profile image uploads with proper validation, user isolation, and error handling.
 */

import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import sharp from 'sharp';
import { v4 as uuidv4 } from 'uuid';
import { s3Config } from '../config/environment';

// Simple logger for S3 service
const logger = {
  info: (messageOrContext: string | any, message?: string) => {
    if (typeof messageOrContext === 'string') {
      console.log(`📝 S3 INFO: ${messageOrContext}`);
    } else {
      console.log(`📝 S3 INFO: ${message}`, messageOrContext);
    }
  },
  warn: (message: string) => console.warn(`⚠️ S3 WARN: ${message}`),
  error: (contextOrMessage: any, message?: string) => {
    if (typeof contextOrMessage === 'string') {
      console.error(`❌ S3 ERROR: ${contextOrMessage}`);
    } else {
      console.error(`❌ S3 ERROR: ${message}`, contextOrMessage);
    }
  }
};

/**
 * 🛡️ SECURE S3 CONFIGURATION
 */
interface S3ServiceConfig {
  bucket: string;
  region: string;
  accessKeyId: string;
  secretAccessKey: string;
}

/**
 * 📸 PROFILE IMAGE METADATA
 */
export interface ProfileImageMetadata {
  s3Key: string;
  url: string;
  originalName: string;
  size: number;
  contentType: string;
  userId: string;
  uploadedAt: Date;
}

/**
 * 📂 FILE UPLOAD RESULT
 */
export interface UploadResult {
  success: boolean;
  data?: ProfileImageMetadata;
  error?: string;
}

/**
 * ⚙️ IMAGE PROCESSING OPTIONS
 */
interface ImageProcessingOptions {
  maxWidth: number;
  maxHeight: number;
  quality: number;
  format: 'jpeg' | 'png' | 'webp';
}

/**
 * 🔐 PROFESSIONAL S3 SERVICE CLASS
 */
export class ProfileImageS3Service {
  private s3Client: S3Client | null = null;
  private config: S3ServiceConfig | null = null;
  private isConfigured = false;

  // 🛡️ Security constraints
  private readonly MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
  private readonly ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  private readonly UPLOAD_PREFIX = 'profile-images';
  
  // 🎨 Image processing defaults
  private readonly defaultImageOptions: ImageProcessingOptions = {
    maxWidth: 512,
    maxHeight: 512,
    quality: 85,
    format: 'jpeg'
  };

  constructor() {
    this.initializeS3Client();
  }

  /**
   * 🚀 INITIALIZE S3 CLIENT WITH SECURE CREDENTIALS
   */
  private initializeS3Client(): void {
    try {
      if (!s3Config.isConfigured || !s3Config.config) {
        logger.warn('⚠️ S3 not configured - profile image uploads will be disabled');
        return;
      }

      this.config = {
        bucket: s3Config.config.S3_BUCKET,
        region: s3Config.config.S3_REGION,
        accessKeyId: s3Config.config.S3_ACCESS_KEY_ID,
        secretAccessKey: s3Config.config.S3_SECRET_ACCESS_KEY
      };

      this.s3Client = new S3Client({
        region: this.config.region,
        credentials: {
          accessKeyId: this.config.accessKeyId,
          secretAccessKey: this.config.secretAccessKey,
        },
      });

      this.isConfigured = true;
      logger.info('✅ S3 client initialized successfully');
    } catch (error) {
      logger.error({ error }, '❌ Failed to initialize S3 client');
      this.isConfigured = false;
    }
  }

  /**
   * 🔍 CHECK IF S3 IS AVAILABLE
   */
  public isAvailable(): boolean {
    return this.isConfigured && this.s3Client !== null && this.config !== null;
  }

  /**
   * 📤 UPLOAD PROFILE IMAGE WITH SECURITY VALIDATION
   */
  public async uploadProfileImage(
    userId: string,
    fileBuffer: Buffer,
    originalName: string,
    mimeType: string
  ): Promise<UploadResult> {
    try {
      // 🛡️ Pre-flight security checks
      const securityCheck = this.validateFileUpload(fileBuffer, mimeType);
      if (!securityCheck.valid) {
        return { success: false, error: securityCheck.error || 'Invalid file' };
      }

      if (!this.isAvailable()) {
        return { success: false, error: 'S3 service not available' };
      }

      // 🎨 Process and optimize image
      const processedImage = await this.processImage(fileBuffer, mimeType);
      
      // 🔐 Generate secure S3 key with user isolation
      const s3Key = this.generateSecureS3Key(userId, originalName);
      
      // 🗑️ Clean up old images before uploading new one
      await this.cleanupOldUserImages(userId);

      // 📤 Upload to S3
      const uploadCommand = new PutObjectCommand({
        Bucket: this.config!.bucket,
        Key: s3Key,
        Body: processedImage.buffer,
        ContentType: processedImage.contentType,
        Metadata: {
          userId,
          originalName,
          uploadedAt: new Date().toISOString(),
          processedBy: 'ProfileImageS3Service'
        },
        // 🔒 Security settings
        ServerSideEncryption: 'AES256',
        CacheControl: 'max-age=31536000', // 1 year
      });

      await this.s3Client!.send(uploadCommand);

      // 📊 Generate result metadata
      const metadata: ProfileImageMetadata = {
        s3Key,
        url: await this.getSignedUrl(s3Key),
        originalName,
        size: processedImage.buffer.length,
        contentType: processedImage.contentType,
        userId,
        uploadedAt: new Date()
      };

      logger.info({ 
        userId, 
        s3Key, 
        size: metadata.size,
        contentType: metadata.contentType 
      }, '✅ Profile image uploaded successfully');

      return { success: true, data: metadata };
    } catch (error) {
      logger.error({ error, userId }, '❌ Failed to upload profile image');
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Upload failed' 
      };
    }
  }

  /**
   * 🗑️ DELETE PROFILE IMAGE
   */
  public async deleteProfileImage(s3Key: string, userId: string): Promise<boolean> {
    try {
      if (!this.isAvailable()) {
        logger.warn('S3 not available for deletion');
        return false;
      }

      // 🛡️ Security: Verify the key belongs to the user
      if (!s3Key.includes(`${this.UPLOAD_PREFIX}/${userId}/`)) {
        logger.error({ s3Key, userId }, '🚨 Security violation: Attempted to delete image not owned by user');
        return false;
      }

      const deleteCommand = new DeleteObjectCommand({
        Bucket: this.config!.bucket,
        Key: s3Key,
      });

      await this.s3Client!.send(deleteCommand);
      
      logger.info({ s3Key, userId }, '✅ Profile image deleted successfully');
      return true;
    } catch (error) {
      logger.error({ error, s3Key, userId }, '❌ Failed to delete profile image');
      return false;
    }
  }

  /**
   * 🔗 GET SIGNED URL FOR SECURE ACCESS
   */
  public async getSignedUrl(s3Key: string, expiresIn: number = 3600): Promise<string> {
    try {
      if (!this.isAvailable()) {
        throw new Error('S3 service not available');
      }

      const command = new GetObjectCommand({
        Bucket: this.config!.bucket,
        Key: s3Key,
      });

      const signedUrl = await getSignedUrl(this.s3Client!, command, { expiresIn });
      return signedUrl;
    } catch (error) {
      logger.error({ error, s3Key }, '❌ Failed to generate signed URL');
      throw error;
    }
  }

  /**
   * 📋 LIST USER IMAGES FOR CLEANUP
   */
  public async listUserImages(userId: string): Promise<string[]> {
    try {
      if (!this.isAvailable()) {
        return [];
      }

      const listCommand = new ListObjectsV2Command({
        Bucket: this.config!.bucket,
        Prefix: `${this.UPLOAD_PREFIX}/${userId}/`,
      });

      const response = await this.s3Client!.send(listCommand);
      return response.Contents?.map(obj => obj.Key!).filter(Boolean) || [];
    } catch (error) {
      logger.error({ error, userId }, '❌ Failed to list user images');
      return [];
    }
  }

  /**
   * 🗑️ CLEANUP OLD USER IMAGES (Keep only latest 3)
   */
  private async cleanupOldUserImages(userId: string): Promise<void> {
    try {
      const userImages = await this.listUserImages(userId);
      
      if (userImages.length <= 3) {
        return; // Keep up to 3 images
      }

      // Sort by creation date and delete older ones
      const imagesToDelete = userImages.slice(0, -2); // Keep latest 2, delete rest
      
      for (const s3Key of imagesToDelete) {
        await this.deleteProfileImage(s3Key, userId);
      }

      logger.info({ userId, deletedCount: imagesToDelete.length }, '🧹 Cleaned up old profile images');
    } catch (error) {
      logger.error({ error, userId }, '❌ Failed to cleanup old images');
    }
  }

  /**
   * 🛡️ FILE UPLOAD SECURITY VALIDATION
   */
  private validateFileUpload(fileBuffer: Buffer, mimeType: string): { valid: boolean; error?: string } {
    // Check file size
    if (fileBuffer.length > this.MAX_FILE_SIZE) {
      return { valid: false, error: `File size too large. Maximum ${this.MAX_FILE_SIZE / 1024 / 1024}MB allowed.` };
    }

    // Check MIME type
    if (!this.ALLOWED_MIME_TYPES.includes(mimeType)) {
      return { valid: false, error: `Invalid file type. Allowed types: ${this.ALLOWED_MIME_TYPES.join(', ')}` };
    }

    // Check for empty file
    if (fileBuffer.length === 0) {
      return { valid: false, error: 'File is empty' };
    }

    return { valid: true };
  }

  /**
   * 🎨 PROCESS AND OPTIMIZE IMAGE
   */
  private async processImage(fileBuffer: Buffer, mimeType: string): Promise<{ buffer: Buffer; contentType: string }> {
    try {
      const options = this.defaultImageOptions;
      
      let sharpInstance = sharp(fileBuffer)
        .resize(options.maxWidth, options.maxHeight, { 
          fit: 'inside',
          withoutEnlargement: true 
        });

      // Apply format-specific processing
      switch (options.format) {
        case 'jpeg':
          sharpInstance = sharpInstance.jpeg({ quality: options.quality });
          break;
        case 'png':
          sharpInstance = sharpInstance.png({ quality: options.quality });
          break;
        case 'webp':
          sharpInstance = sharpInstance.webp({ quality: options.quality });
          break;
      }

      const processedBuffer = await sharpInstance.toBuffer();
      
      return {
        buffer: processedBuffer,
        contentType: `image/${options.format}`
      };
    } catch (error) {
      logger.error({ error }, '❌ Failed to process image');
      // Fallback: return original if processing fails
      return {
        buffer: fileBuffer,
        contentType: mimeType
      };
    }
  }

  /**
   * 🔐 GENERATE SECURE S3 KEY WITH USER ISOLATION
   */
  private generateSecureS3Key(userId: string, originalName: string): string {
    const timestamp = Date.now();
    const randomId = uuidv4();
    const sanitizedName = originalName.replace(/[^a-zA-Z0-9.-]/g, '_');
    
    return `${this.UPLOAD_PREFIX}/${userId}/${timestamp}_${randomId}_${sanitizedName}`;
  }

  /**
   * 🔍 TEST S3 CONNECTION
   */
  public async testConnection(): Promise<{ success: boolean; error?: string }> {
    try {
      if (!this.isAvailable()) {
        return { success: false, error: 'S3 service not configured' };
      }

      // Test with a simple list operation
      const listCommand = new ListObjectsV2Command({
        Bucket: this.config!.bucket,
        MaxKeys: 1,
      });

      await this.s3Client!.send(listCommand);
      
      logger.info('✅ S3 connection test successful');
      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error({ error }, '❌ S3 connection test failed');
      return { success: false, error: errorMessage };
    }
  }
}

// 🔐 Export singleton instance
export const profileImageS3Service = new ProfileImageS3Service();
export default profileImageS3Service;
