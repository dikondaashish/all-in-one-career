/**
 * 🔐 SECURE ENVIRONMENT CONFIGURATION
 * 
 * This module handles secure loading and validation of environment variables,
 * with special focus on AWS S3 credentials protection.
 */

import dotenv from 'dotenv';

// Simple logger for environment setup (avoids circular dependency)
const logger = {
  info: (message: string | object, msg?: string) => {
    if (typeof message === 'string') {
      console.log(`📝 INFO: ${message}`);
    } else {
      console.log(`📝 INFO: ${msg || 'Log'}\n   Context:`, JSON.stringify(message, null, 2));
    }
  },
  warn: (message: string | object, msg?: string) => {
    if (typeof message === 'string') {
      console.warn(`⚠️ WARN: ${message}`);
    } else {
      console.warn(`⚠️ WARN: ${msg || 'Warning'}\n   Context:`, JSON.stringify(message, null, 2));
    }
  },
  error: (message: string | object, msg?: string) => {
    if (typeof message === 'string') {
      console.error(`❌ ERROR: ${message}`);
    } else {
      console.error(`❌ ERROR: ${msg || 'Error'}\n   Context:`, JSON.stringify(message, null, 2));
    }
  }
};

// Load environment variables from .env files
dotenv.config();
dotenv.config({ path: '.env.local' });

interface EnvironmentConfig {
  // Server Configuration
  NODE_ENV: string;
  PORT: number;
  
  // Database
  DATABASE_URL: string;
  
  // Firebase Configuration
  FIREBASE_PROJECT_ID?: string;
  FIREBASE_SERVICE_ACCOUNT_JSON?: string;
  
  // AI Services
  GEMINI_API_KEY?: string;
  
  // AWS S3 Configuration - CRITICAL SECURITY
  S3_BUCKET?: string;
  S3_REGION?: string;
  S3_ACCESS_KEY_ID?: string;
  S3_SECRET_ACCESS_KEY?: string;
  
  // Security
  JWT_SECRET?: string;
  ADMIN_SECRET?: string;
  
  // Puppeteer
  PUPPETEER_SKIP_CHROMIUM_DOWNLOAD?: string;
}

/**
 * 🛡️ SECURE CREDENTIAL VALIDATOR
 * Validates environment variables without logging sensitive data
 */
class EnvironmentValidator {
  private static requiredVars = [
    'NODE_ENV',
    'PORT',
    'DATABASE_URL'
  ];

  private static s3RequiredVars = [
    'S3_BUCKET',
    'S3_REGION', 
    'S3_ACCESS_KEY_ID',
    'S3_SECRET_ACCESS_KEY'
  ];

  /**
   * Validates core environment variables
   */
  static validateCore(): EnvironmentConfig {
    const config: Partial<EnvironmentConfig> = {};
    const missing: string[] = [];

    // Validate required variables
    for (const varName of this.requiredVars) {
      const value = process.env[varName];
      if (!value) {
        missing.push(varName);
      } else {
        (config as any)[varName] = varName === 'PORT' ? parseInt(value, 10) : value;
      }
    }

    // Check for missing required variables
    if (missing.length > 0) {
      const error = `❌ CRITICAL: Missing required environment variables: ${missing.join(', ')}`;
      logger.error({ missing }, error);
      throw new Error(error);
    }

    // Validate optional variables
    this.loadOptionalVars(config);

    logger.info('✅ Environment configuration loaded successfully');
    return config as EnvironmentConfig;
  }

  /**
   * 🔐 S3 CREDENTIAL VALIDATION
   * Validates S3 credentials are present and properly formatted
   */
  static validateS3(): { isConfigured: boolean; config?: S3Config } {
    const s3Missing: string[] = [];
    const s3Config: Partial<S3Config> = {};

    for (const varName of this.s3RequiredVars) {
      const value = process.env[varName];
      if (!value) {
        s3Missing.push(varName);
      } else {
        (s3Config as any)[varName] = value;
      }
    }

    if (s3Missing.length > 0) {
      logger.warn({ missing: s3Missing }, '⚠️ S3 credentials incomplete - profile image upload will be disabled');
      return { isConfigured: false };
    }

    // Validate S3 credential format
    const accessKeyId = s3Config.S3_ACCESS_KEY_ID;
    const secretKey = s3Config.S3_SECRET_ACCESS_KEY;

    if (accessKeyId && !accessKeyId.startsWith('AKIA')) {
      logger.error('❌ S3_ACCESS_KEY_ID format appears invalid (should start with AKIA)');
      return { isConfigured: false };
    }

    if (secretKey && secretKey.length < 20) {
      logger.error('❌ S3_SECRET_ACCESS_KEY appears too short');
      return { isConfigured: false };
    }

    logger.info('✅ S3 credentials validated successfully');
    return { 
      isConfigured: true, 
      config: s3Config as S3Config 
    };
  }

  /**
   * Load optional environment variables
   */
  private static loadOptionalVars(config: Partial<EnvironmentConfig>) {
    const optionalVars = [
      'FIREBASE_PROJECT_ID',
      'FIREBASE_SERVICE_ACCOUNT_JSON', 
      'GEMINI_API_KEY',
      'S3_BUCKET',
      'S3_REGION',
      'S3_ACCESS_KEY_ID', 
      'S3_SECRET_ACCESS_KEY',
      'JWT_SECRET',
      'ADMIN_SECRET',
      'PUPPETEER_SKIP_CHROMIUM_DOWNLOAD'
    ];

    for (const varName of optionalVars) {
      const value = process.env[varName];
      if (value) {
        (config as any)[varName] = value;
      }
    }
  }
}

/**
 * 🔐 S3 Configuration Interface
 */
export interface S3Config {
  S3_BUCKET: string;
  S3_REGION: string;
  S3_ACCESS_KEY_ID: string;
  S3_SECRET_ACCESS_KEY: string;
}

// Export validated configuration
export const env = EnvironmentValidator.validateCore();
export const s3Config = EnvironmentValidator.validateS3();

export default env;