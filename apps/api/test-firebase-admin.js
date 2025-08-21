#!/usr/bin/env node

/**
 * Firebase Admin Configuration Test Script
 * Run this to verify your Firebase Admin configuration
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔍 Testing Firebase Admin Configuration...\n');

const envPath = path.join(__dirname, '.env');
const envExamplePath = path.join(__dirname, '.env.example');

console.log('📁 Checking for environment files...');

if (!fs.existsSync(envPath)) {
  console.log('❌ .env file not found');
  console.log('📝 Please create .env file with your Firebase Admin configuration');
  console.log('💡 You need FIREBASE_SERVICE_ACCOUNT_JSON for the API to work\n');
  
  if (fs.existsSync(envExamplePath)) {
    console.log('📋 Example environment variables needed:');
    const exampleContent = fs.readFileSync(envExamplePath, 'utf8');
    console.log(exampleContent);
  }
  
  process.exit(1);
}

console.log('✅ .env file found');

// Read and parse .env
const envContent = fs.readFileSync(envPath, 'utf8');
const envVars = {};

envContent.split('\n').forEach(line => {
  const [key, ...valueParts] = line.split('=');
  if (key && valueParts.length > 0) {
    envVars[key.trim()] = valueParts.join('=').trim();
  }
});

// Check required variables
const requiredVars = [
  'DATABASE_URL',
  'JWT_SECRET',
  'FIREBASE_SERVICE_ACCOUNT_JSON'
];

console.log('\n🔧 Checking required environment variables...');

let allConfigured = true;

requiredVars.forEach(varName => {
  const value = envVars[varName];
  if (!value) {
    console.log(`❌ ${varName}: Not configured`);
    allConfigured = false;
  } else if (varName === 'FIREBASE_SERVICE_ACCOUNT_JSON') {
    try {
      const parsed = JSON.parse(value);
      if (parsed.type === 'service_account' && parsed.private_key) {
        console.log(`✅ ${varName}: Valid service account JSON`);
      } else {
        console.log(`❌ ${varName}: Invalid service account JSON format`);
        allConfigured = false;
      }
    } catch (error) {
      console.log(`❌ ${varName}: Invalid JSON format`);
      allConfigured = false;
    }
  } else if (varName === 'JWT_SECRET' && (value === 'your-secret-key' || value.length < 10)) {
    console.log(`❌ ${varName}: Using weak or default secret`);
    allConfigured = false;
  } else {
    console.log(`✅ ${varName}: Configured`);
  }
});

if (!allConfigured) {
  console.log('\n❌ Configuration incomplete!');
  console.log('📝 Please update your .env file with the required values');
  console.log('\n🔑 To get Firebase Service Account JSON:');
  console.log('1. Go to Firebase Console > Project Settings');
  console.log('2. Click "Service accounts" tab');
  console.log('3. Click "Generate new private key"');
  console.log('4. Download and copy the entire JSON content');
  console.log('5. Paste it as the value for FIREBASE_SERVICE_ACCOUNT_JSON');
  process.exit(1);
}

console.log('\n✅ All required environment variables are configured!');
console.log('\n🚀 Next steps:');
console.log('1. Make sure your database is running and accessible');
console.log('2. Restart your API server');
console.log('3. Check the server logs for Firebase initialization messages');
console.log('4. Test the /health endpoint');

console.log('\n📚 For detailed setup instructions, see SETUP_FIREBASE.md');
