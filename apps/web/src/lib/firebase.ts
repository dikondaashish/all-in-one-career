import { initializeApp, FirebaseApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, Auth } from 'firebase/auth';

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

let app: FirebaseApp | undefined;
let auth: Auth;
let provider: GoogleAuthProvider;

try {
  if (validateFirebaseConfig()) {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    provider = new GoogleAuthProvider();
    
    // Optimize Google Auth Provider
    provider.addScope('email');
    provider.addScope('profile');
    provider.setCustomParameters({
      prompt: 'select_account', // Allow users to select account without forcing login
      // hd: 'example.com', // Uncomment to restrict to specific domain
    });
    
    console.log('Firebase initialized successfully with optimized settings');
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
  } as unknown as Auth;
  provider = {
    addScope: () => {
      throw new Error('Firebase is not configured. Please set your environment variables.');
    }
  } as unknown as GoogleAuthProvider;
}

export { auth, provider };
