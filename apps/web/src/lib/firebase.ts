import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Validate Firebase configuration
const validateFirebaseConfig = () => {
  const requiredFields = [
    'apiKey',
    'authDomain', 
    'projectId',
    'storageBucket',
    'messagingSenderId',
    'appId'
  ];
  
  const missingFields = requiredFields.filter(field => !firebaseConfig[field as keyof typeof firebaseConfig]);
  
  if (missingFields.length > 0) {
    console.error('Missing Firebase configuration:', missingFields);
    console.error('Please set the following environment variables:');
    missingFields.forEach(field => {
      console.error(`  NEXT_PUBLIC_${field.toUpperCase()}`);
    });
    return false;
  }
  
  return true;
};

let app: any;
let auth: any;
let provider: any;

try {
  if (validateFirebaseConfig()) {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    provider = new GoogleAuthProvider();
    console.log('Firebase initialized successfully');
  } else {
    throw new Error('Firebase configuration incomplete');
  }
} catch (error) {
  console.error('Firebase initialization failed:', error);
  // Create mock objects that will throw helpful errors when used
  auth = {
    onAuthStateChanged: () => {
      throw new Error('Firebase is not configured. Please set your environment variables.');
    }
  };
  provider = {
    addScope: () => {
      throw new Error('Firebase is not configured. Please set your environment variables.');
    }
  };
}

export { auth, provider };
