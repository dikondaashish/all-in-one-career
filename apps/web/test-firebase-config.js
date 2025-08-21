#!/usr/bin/env node

/**
 * Firebase Configuration Test Script
 * Run this to verify your Firebase configuration
 */

console.log('🔍 Testing Firebase Configuration...\n');

// Check if we're in the right directory
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '.env.local');
const envExamplePath = path.join(__dirname, 'env.example');

console.log('📁 Checking for environment files...');

if (!fs.existsSync(envPath)) {
  console.log('❌ .env.local file not found');
  console.log('📝 Please create .env.local file with your Firebase configuration');
  console.log('💡 You can copy from env.example and fill in your values\n');
  
  if (fs.existsSync(envExamplePath)) {
    console.log('📋 Example environment variables needed:');
    const exampleContent = fs.readFileSync(envExamplePath, 'utf8');
    console.log(exampleContent);
  }
  
  process.exit(1);
}

console.log('✅ .env.local file found');

// Read and parse .env.local
const envContent = fs.readFileSync(envPath, 'utf8');
const envVars = {};

envContent.split('\n').forEach(line => {
  const [key, ...valueParts] = line.split('=');
  if (key && valueParts.length > 0) {
    envVars[key.trim()] = valueParts.join('=').trim();
  }
});

// Check required Firebase variables
const requiredVars = [
  'NEXT_PUBLIC_FIREBASE_API_KEY',
  'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
  'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
  'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
  'NEXT_PUBLIC_FIREBASE_SENDER_ID',
  'NEXT_PUBLIC_FIREBASE_APP_ID'
];

console.log('\n🔧 Checking Firebase environment variables...');

let allConfigured = true;

requiredVars.forEach(varName => {
  const value = envVars[varName];
  if (!value || value === 'your_firebase_api_key_here' || value.includes('your_')) {
    console.log(`❌ ${varName}: Not configured or using placeholder value`);
    allConfigured = false;
  } else {
    console.log(`✅ ${varName}: Configured`);
  }
});

if (!allConfigured) {
  console.log('\n❌ Firebase configuration incomplete!');
  console.log('📝 Please update your .env.local file with actual Firebase values');
  console.log('🌐 Get these from: https://console.firebase.google.com/ > Project Settings > General');
  process.exit(1);
}

console.log('\n✅ All Firebase environment variables are configured!');
console.log('\n🚀 Next steps:');
console.log('1. Make sure your Firebase project has Google Authentication enabled');
console.log('2. Add localhost:3000 to authorized domains in Firebase Console');
console.log('3. Restart your development server');
console.log('4. Try logging in again');

console.log('\n📚 For detailed setup instructions, see SETUP_FIREBASE.md');
