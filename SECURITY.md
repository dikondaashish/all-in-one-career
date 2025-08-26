# Security Guidelines

## 🔐 Environment Variables

**IMPORTANT**: Never commit API keys or sensitive information to the repository.

### Required Environment Variables

#### Backend API (`apps/api`)
Create `apps/api/.env` with:

```env
# Database Configuration
DATABASE_URL="mysql://username:password@host:port/database"

# Google Gemini AI (REQUIRED)
GEMINI_API_KEY="your-gemini-api-key-here"

# Firebase Configuration
FIREBASE_PROJECT_ID="your-firebase-project-id"
FIREBASE_SERVICE_ACCOUNT_JSON='{"type":"service_account",...}'

# AWS Configuration (Optional)
AWS_ACCESS_KEY_ID="your-aws-access-key"
AWS_SECRET_ACCESS_KEY="your-aws-secret-key"
AWS_REGION="us-east-1"

# Application
NODE_ENV="production"
PORT="3001"
JWT_SECRET="your-secure-jwt-secret"
```

#### Frontend Web (`apps/web`)
Create `apps/web/.env.local` with:

```env
# API Configuration
NEXT_PUBLIC_API_BASE_URL="https://your-api-domain.com"

# Firebase Configuration  
NEXT_PUBLIC_FIREBASE_API_KEY="your-firebase-api-key"
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="your-project.firebaseapp.com"
NEXT_PUBLIC_FIREBASE_PROJECT_ID="your-project-id"
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="your-project.appspot.com"
NEXT_PUBLIC_FIREBASE_SENDER_ID="your-sender-id"
NEXT_PUBLIC_FIREBASE_APP_ID="your-app-id"
```

## 🚨 Security Issues Fixed

### Issue #3: Google API Key Exposed (apps/web/next.config.js:4)
- **Status**: ❌ False positive - No API key found in next.config.js
- **Action**: Verified file contains no sensitive data

### Issue #1: Google API Key Exposed (apps/api/src/lib/gemini.ts:4)
- **Status**: ✅ FIXED
- **Action**: Removed hardcoded fallback API key
- **Change**: Now requires `GEMINI_API_KEY` environment variable

## 🛡️ Security Best Practices

1. **Environment Files**: 
   - Use `.env` files for sensitive data
   - Add all `.env*` patterns to `.gitignore`
   - Use `.env.example` as templates

2. **API Keys**:
   - Never commit API keys to version control
   - Use environment variables in production
   - Rotate keys regularly

3. **Database**:
   - Use connection strings with strong passwords
   - Enable SSL/TLS for database connections
   - Use database user with minimal required permissions

4. **Deployment**:
   - Set environment variables in deployment platform
   - Use secrets management for production
   - Enable HTTPS for all endpoints

## 📋 Checklist

Before deploying:

- [ ] All API keys moved to environment variables
- [ ] No hardcoded secrets in codebase
- [ ] Environment files in `.gitignore`
- [ ] Production environment configured
- [ ] SSL/HTTPS enabled
- [ ] Database connection secured

## 🔍 Regular Security Audits

Run these commands regularly:

```bash
# Check for potential secrets
git log --all --full-history -- "*.env*"

# Scan for hardcoded API keys
grep -r "AIza" . --exclude-dir=node_modules
grep -r "sk-" . --exclude-dir=node_modules

# Check environment files are ignored
git check-ignore apps/api/.env
git check-ignore apps/web/.env.local
```
