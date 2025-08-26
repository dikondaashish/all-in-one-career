# Deployment Security Setup

## 🔐 Environment Variables for Production

Since all hardcoded API keys have been removed, you MUST set these environment variables in your deployment platforms:

### Vercel (Frontend - apps/web)
Set these in Vercel Dashboard → Project Settings → Environment Variables:

```
NEXT_PUBLIC_API_BASE_URL=https://your-api-domain.onrender.com
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyAAB9LMPB7keVnIvoYniuJvPmkUTEs8lE4
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=all-in-one-career.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=all-in-one-career
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=all-in-one-career.firebasestorage.app
NEXT_PUBLIC_FIREBASE_SENDER_ID=125611737799
NEXT_PUBLIC_FIREBASE_APP_ID=1:125611737799:web:0ddf321dd428b3ee2074e2
```

### Render (Backend API - apps/api)
Set these in Render Dashboard → Service → Environment:

```
DATABASE_URL=mysql://u151079874_all_in_one:password@host:3306/database
GEMINI_API_KEY=AIzaSyBJvkuDo6TC2GXfulO12R7uhfoJG-p73d8
FIREBASE_PROJECT_ID=all-in-one-career
FIREBASE_SERVICE_ACCOUNT_JSON={"type":"service_account",...}
S3_ACCESS_KEY_ID=AKIAX4TSC323T6VFZKJR
S3_SECRET_ACCESS_KEY=your-secret-key
AWS_REGION=us-east-1
NODE_ENV=production
PORT=3001
```

## 🚨 CRITICAL - Application Will Not Work Without These Variables

The application now properly requires environment variables and will fail to start if they're missing. This is a security improvement.

### Backend Startup
- ✅ Will throw error if `GEMINI_API_KEY` is missing
- ✅ Will throw error if `DATABASE_URL` is missing
- ✅ Firebase features will be disabled if credentials are missing

### Frontend Startup
- ✅ Will show configuration errors if Firebase variables are missing
- ✅ Will fall back gracefully but with limited functionality

## 🔧 Local Development Setup

1. **Copy example files:**
   ```bash
   cp .env.example .env
   cp apps/web/env.example apps/web/.env.local
   ```

2. **Fill in your actual values** (never commit these files)

3. **Verify security:**
   ```bash
   ./scripts/security-check.sh
   ```

## ✅ Security Improvements Made

1. **Removed hardcoded API keys** from `apps/api/src/lib/gemini.ts`
2. **Updated all services** to require environment variables
3. **Added security validation script** that excludes .env files
4. **Updated .gitignore** to ensure environment files are never committed
5. **Created comprehensive documentation** for secure deployment

## 🔄 Regular Security Maintenance

Run the security check before each deployment:
```bash
./scripts/security-check.sh
```

This will ensure no secrets accidentally get committed to the repository.
