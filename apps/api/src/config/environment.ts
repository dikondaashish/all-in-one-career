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
  NODE_ENV: string;
  PORT: number;
  DATABASE_URL: string;
  FIREBASE_PROJECT_ID?: string;
  FIREBASE_SERVICE_ACCOUNT_JSON?: string;
  GEMINI_API_KEY?: string;
  S3_BUCKET?: string;
  S3_REGION?: string;
  S3_ACCESS_KEY_ID?: string;
  S3_SECRET_ACCESS_KEY?: string;
  JWT_SECRET?: string;
  ADMIN_SECRET?: string;
  PUPPETEER_SKIP_CHROMIUM_DOWNLOAD?: string;
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

class EnvironmentValidator {
  static validateCore(): EnvironmentConfig {
    const config: Partial<EnvironmentConfig> = {};
    const required = ['NODE_ENV', 'PORT', 'DATABASE_URL'];
    const missing: string[] = [];

    for (const varName of required) {
      const value = process.env[varName];
      if (!value) {
        missing.push(varName);
      } else {
        (config as any)[varName] = varName === 'PORT' ? parseInt(value, 10) : value;
      }
    }

    if (missing.length > 0) {
      throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
    }

    // Load optional variables
    const optional = ['FIREBASE_PROJECT_ID', 'FIREBASE_SERVICE_ACCOUNT_JSON', 'GEMINI_API_KEY', 
                     'S3_BUCKET', 'S3_REGION', 'S3_ACCESS_KEY_ID', 'S3_SECRET_ACCESS_KEY',
                     'JWT_SECRET', 'ADMIN_SECRET', 'PUPPETEER_SKIP_CHROMIUM_DOWNLOAD'];

    for (const varName of optional) {
      const value = process.env[varName];
      if (value) {
        (config as any)[varName] = value;
      }
    }

    logger.info('✅ Environment configuration loaded successfully');
    return config as EnvironmentConfig;
  }

  static validateS3(): { isConfigured: boolean; config?: S3Config } {
    const s3Vars = ['S3_BUCKET', 'S3_REGION', 'S3_ACCESS_KEY_ID', 'S3_SECRET_ACCESS_KEY'];
    const s3Config: Partial<S3Config> = {};
    const missing: string[] = [];

    for (const varName of s3Vars) {
      const value = process.env[varName];
      if (!value) {
        missing.push(varName);
      } else {
        (s3Config as any)[varName] = value;
      }
    }

    if (missing.length > 0) {
      logger.warn({ missing }, '⚠️ S3 credentials incomplete - profile image upload will be disabled');
      return { isConfigured: false };
    }

    logger.info('✅ S3 credentials validated successfully');
    return { isConfigured: true, config: s3Config as S3Config };
  }
}

export const env = EnvironmentValidator.validateCore();
export const s3Config = EnvironmentValidator.validateS3();
export default env;
