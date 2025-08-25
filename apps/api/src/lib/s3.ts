import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl as awsGetSignedUrl } from '@aws-sdk/s3-request-presigner';
import crypto from 'crypto';

// Initialize S3 client
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

const BUCKET_NAME = process.env.S3_BUCKET_NAME || 'all-in-one-career-uploads';

/**
 * Upload a file buffer to S3
 * @param buffer File buffer
 * @param key S3 object key
 * @param contentType MIME type
 * @returns Promise with upload result
 */
export async function putObject(
  buffer: Buffer, 
  key: string, 
  contentType: string
): Promise<{ key: string; url: string }> {
  try {
    console.log(`📁 Uploading to S3: ${key}, Content-Type: ${contentType}, Size: ${buffer.length} bytes`);
    
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: buffer,
      ContentType: contentType,
      ServerSideEncryption: 'AES256',
    });

    await s3Client.send(command);
    
    const url = `https://${BUCKET_NAME}.s3.amazonaws.com/${key}`;
    console.log(`✅ S3 Upload successful: ${url}`);
    
    return { key, url };
  } catch (error) {
    console.error('❌ S3 Upload failed:', error);
    throw new Error(`S3 upload failed: ${error}`);
  }
}

/**
 * Generate a signed URL for accessing an S3 object
 * @param key S3 object key
 * @param expiresIn Expiration time in seconds (default: 1 hour)
 * @returns Promise with signed URL
 */
export async function getSignedUrl(
  key: string, 
  expiresIn: number = 3600
): Promise<string> {
  try {
    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });

    const signedUrl = await awsGetSignedUrl(s3Client, command, { expiresIn });
    console.log(`🔗 Generated signed URL for: ${key}`);
    
    return signedUrl;
  } catch (error) {
    console.error('❌ Failed to generate signed URL:', error);
    throw new Error(`Failed to generate signed URL: ${error}`);
  }
}

/**
 * Generate a unique S3 key for a file
 * @param userId User ID
 * @param originalFilename Original filename
 * @param fileType File extension
 * @returns Unique S3 key
 */
export function generateS3Key(
  userId: string, 
  originalFilename: string, 
  fileType: string
): string {
  const timestamp = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  const randomId = crypto.randomUUID().substring(0, 8);
  const sanitizedFilename = originalFilename.replace(/[^a-zA-Z0-9.-]/g, '_');
  
  return `resumes/${userId}/${timestamp}/${randomId}-${sanitizedFilename}`;
}

/**
 * Check if S3 is properly configured
 * @returns boolean indicating if S3 is configured
 */
export function isS3Configured(): boolean {
  return !!(
    process.env.AWS_ACCESS_KEY_ID &&
    process.env.AWS_SECRET_ACCESS_KEY &&
    process.env.S3_BUCKET_NAME
  );
}
