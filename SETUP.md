# API Setup Guide

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```bash
# Database
DATABASE_URL="postgresql://your-username:your-password@your-host:5432/your-database"

# Firebase (you'll need to get this from Firebase Console)
FIREBASE_SERVICE_ACCOUNT_JSON="{\"type\":\"service_account\",\"project_id\":\"your-project-id\",\"private_key_id\":\"...\",\"private_key\":\"...\",\"client_email\":\"...\",\"client_id\":\"...\",\"auth_uri\":\"https://accounts.google.com/o/oauth2/auth\",\"token_uri\":\"https://oauth2.googleapis.com/token\",\"auth_provider_x509_cert_url\":\"https://www.googleapis.com/oauth2/v1/certs\",\"client_x509_cert_url\":\"...\"}"

# Gemini AI (get from Google AI Studio)
GEMINI_API_KEY="your-gemini-api-key"

# Optional: Gemini model (defaults to gemini-1.5-flash)
GEMINI_MODEL="gemini-1.5-flash"

# Admin Configuration (for global announcements)
ADMIN_SECRET="climbly_admin_secret_2024"

# Server port (optional, defaults to 4000)
PORT=4000
```

## Getting the Required Keys

### 1. Database URL
- You already have this set up (Neon PostgreSQL)
- Check your existing `.env` file for the DATABASE_URL

### 2. Firebase Service Account
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Go to Project Settings > Service Accounts
4. Click "Generate new private key"
5. Download the JSON file
6. Copy the entire JSON content as a single line in your `.env` file

### 3. Gemini API Key
1. Go to [Google AI Studio](https://aistudio.google.com/)
2. Create a new API key
3. Copy the key to your `.env` file

## Starting the API

Once you have the `.env` file set up:

```bash
cd apps/api
pnpm dev
```

You should see: **API running on :4000**

## Testing the API

Test the health endpoint:
```bash
curl http://localhost:4000/health
```

Should return: `{"ok": true}`
