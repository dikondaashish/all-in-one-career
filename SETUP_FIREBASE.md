# Firebase Setup Guide - Fix Login Issues

## Problem
The application is currently showing "Failed to sign in. Please try again" because Firebase is not properly configured.

## Solution Steps

### 1. Create Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or select existing one
3. Enable Authentication with Google Sign-in method

### 2. Configure Web App Environment Variables

Create a `.env.local` file in `apps/web/` directory:

```bash
# API Configuration
NEXT_PUBLIC_API_URL=https://all-in-one-career-api.onrender.com

# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_actual_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
NEXT_PUBLIC_FIREBASE_SENDER_ID=your_sender_id_here
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id_here
```

**To get these values:**
1. In Firebase Console, go to Project Settings (gear icon)
2. Scroll down to "Your apps" section
3. Click on the web app or create one
4. Copy the config values

### 3. Configure API Environment Variables

Create a `.env` file in `apps/api/` directory:

```bash
# Database Configuration
DATABASE_URL="postgresql://username:password@localhost:5432/your_database_name"

# JWT Configuration
JWT_SECRET="your-super-secret-jwt-key-here"

# Firebase Admin Configuration
# Get this from Firebase Console > Project Settings > Service Accounts > Generate New Private Key
FIREBASE_SERVICE_ACCOUNT_JSON='{"type":"service_account","project_id":"your-project-id","private_key_id":"key-id","private_key":"-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY_HERE\n-----END PRIVATE KEY-----\n","client_email":"firebase-adminsdk-xxxxx@your-project-id.iam.gserviceaccount.com","client_id":"client-id","auth_uri":"https://accounts.google.com/o/oauth2/auth","token_uri":"https://oauth2.googleapis.com/token","auth_provider_x509_cert_url":"https://www.googleapis.com/oauth2/v1/certs","client_x509_cert_url":"https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-xxxxx%40your-project-id.iam.gserviceaccount.com"}'

# Gemini API Configuration (optional)
GEMINI_API_KEY="your-gemini-api-key-here"

# Admin Secret for Global Announcements
ADMIN_SECRET="your-admin-secret-here"

# Optional: Port Configuration
PORT=4000
```

**To get Firebase Service Account JSON:**
1. In Firebase Console, go to Project Settings
2. Click "Service accounts" tab
3. Click "Generate new private key"
4. Download the JSON file
5. Copy the entire content and paste it as the value for `FIREBASE_SERVICE_ACCOUNT_JSON`

### 4. Enable Google Authentication in Firebase
1. In Firebase Console, go to Authentication
2. Click "Sign-in method"
3. Enable Google provider
4. Add your authorized domains (localhost:3000 for development)

### 5. Restart Applications
After setting environment variables:
```bash
# Stop both apps
# Then restart them
cd apps/web && npm run dev
cd apps/api && npm run dev
```

### 6. Test Login
1. Open the web app
2. Try Google Sign-in
3. Check browser console for any errors
4. Check API logs for Firebase initialization messages

## Troubleshooting

### Common Issues:
1. **"Firebase is not configured"** - Check environment variables are set correctly
2. **"Invalid API key"** - Verify Firebase API key in .env.local
3. **"Service account not found"** - Check FIREBASE_SERVICE_ACCOUNT_JSON in API .env
4. **CORS errors** - Verify CORS configuration in API

### Debug Steps:
1. Check browser console for Firebase errors
2. Check API server logs for Firebase initialization
3. Verify environment variables are loaded (check console.log output)
4. Test Firebase connection in browser console

## Security Notes
- Never commit .env files to git
- Use strong JWT secrets
- Restrict Firebase service account permissions
- Use environment-specific Firebase projects for dev/prod
