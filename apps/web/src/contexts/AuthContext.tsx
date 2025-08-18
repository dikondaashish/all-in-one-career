'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { 
  User, 
  signInWithPopup, 
  signOut, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence
} from 'firebase/auth';
import { auth, provider } from '@/lib/firebase';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  isGuest: boolean;
  signIn: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string) => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
  signOutUser: () => Promise<void>;
  setRememberMe: (remember: boolean) => Promise<void>;
  hasSkippedAuth: () => boolean;
  clearSkipFlag: () => void;
  setGuestMode: (isGuest: boolean) => void;
  getAuthToken: () => string | null;
  setAuthToken: (token: string) => void;
  clearAuthToken: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isGuest, setIsGuest] = useState(false);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUser(user);
      setIsAuthenticated(!!user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signIn = async () => {
    try {
      // STEP 2: Google Firebase authentication first
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      
      // Get Firebase ID token
      const firebaseToken = await user.getIdToken();
      
      // Call backend to get JWT token
      const API_BASE_URL = process.env.NODE_ENV === 'production' 
        ? 'https://all-in-one-career-api.onrender.com'
        : 'http://localhost:4000';
        
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firebaseToken,
          email: user.email,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Backend auth error:', response.status, errorData);
        throw new Error(`Failed to authenticate with backend: ${response.status}`);
      }

      const { token } = await response.json();
      
      // Store JWT token in localStorage
      setAuthToken(token);
      
      console.log('Google login successful, JWT token stored');
      
    } catch (error) {
      console.error('Google sign in error:', error);
      throw error;
    }
  };

  const signInWithEmail = async (email: string, password: string) => {
    try {
      // STEP 2: Firebase authentication first
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Get Firebase ID token
      const firebaseToken = await user.getIdToken();
      
      // Call backend to get JWT token
      const API_BASE_URL = process.env.NODE_ENV === 'production' 
        ? 'https://all-in-one-career-api.onrender.com'
        : 'http://localhost:4000';
        
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firebaseToken,
          email: user.email,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Backend auth error:', response.status, errorData);
        throw new Error(`Failed to authenticate with backend: ${response.status}`);
      }

      const { token } = await response.json();
      
      // Store JWT token in localStorage
      setAuthToken(token);
      
      console.log('Login successful, JWT token stored');
      
    } catch (err: unknown) {
      console.error('Email sign in error:', err);
      if (err instanceof Error && 'code' in err) {
        const errorCode = (err as { code: string }).code;
        if (errorCode === 'auth/invalid-credential') {
          throw new Error('Incorrect email or password');
        } else if (errorCode === 'auth/user-not-found') {
          throw new Error('No account found with this email');
        } else if (errorCode === 'auth/wrong-password') {
          throw new Error('Incorrect password');
        } else if (errorCode === 'auth/too-many-requests') {
          throw new Error('Too many failed attempts. Please try again later');
        } else {
          throw new Error('Failed to sign in. Please try again');
        }
      } else {
        throw new Error('Failed to sign in. Please try again');
      }
    }
  };

  const signUpWithEmail = async (email: string, password: string) => {
    try {
      // STEP 2: Firebase account creation first
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Get Firebase ID token
      const firebaseToken = await user.getIdToken();
      
      // Call backend to get JWT token
      const API_BASE_URL = process.env.NODE_ENV === 'production' 
        ? 'https://all-in-one-career-api.onrender.com'
        : 'http://localhost:4000';
        
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firebaseToken,
          email: user.email,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Backend auth error:', response.status, errorData);
        throw new Error(`Failed to authenticate with backend: ${response.status}`);
      }

      const { token } = await response.json();
      
      // Store JWT token in localStorage
      setAuthToken(token);
      
      console.log('Signup successful, JWT token stored');
      
    } catch (err: unknown) {
      console.error('Email sign up error:', err);
      if (err instanceof Error && 'code' in err) {
        const errorCode = (err as { code: string }).code;
        if (errorCode === 'auth/email-already-in-use') {
          throw new Error('An account with this email already exists');
        } else if (errorCode === 'auth/weak-password') {
          throw new Error('Password should be at least 6 characters');
        } else if (errorCode === 'auth/invalid-email') {
          throw new Error('Please enter a valid email address');
        } else {
          throw new Error('Failed to create account. Please try again');
        }
      } else {
        throw new Error('Failed to create account. Please try again');
      }
    }
  };

  const sendPasswordReset = async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (err: unknown) {
      console.error('Password reset error:', err);
      if (err instanceof Error && 'code' in err) {
        const errorCode = (err as { code: string }).code;
        if (errorCode === 'auth/user-not-found') {
          throw new Error('No account found with this email');
        } else if (errorCode === 'auth/invalid-email') {
          throw new Error('Please enter a valid email address');
        } else {
          throw new Error('Failed to send reset email. Please try again');
        }
      } else {
        throw new Error('Failed to send reset email. Please try again');
      }
    }
  };

  const setRememberMe = async (remember: boolean) => {
    try {
      if (remember) {
        await setPersistence(auth, browserLocalPersistence);
      } else {
        await setPersistence(auth, browserSessionPersistence);
      }
    } catch (error) {
      console.error('Persistence error:', error);
    }
  };

  const signOutUser = async () => {
    try {
      // STEP 5: Sign out from Firebase and clear all auth state
      await signOut(auth);
      clearAuthToken();
      setGuestMode(false);
    } catch (error) {
      console.error('Sign out error:', error);
      // Force clear even if Firebase signOut fails
      clearAuthToken();
      setGuestMode(false);
    }
  };

  const hasSkippedAuth = (): boolean => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem('climbly_skip_guest') === 'true';
  };

  const clearSkipFlag = (): void => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem('climbly_skip_guest');
  };

  // JWT Token management
  const getAuthToken = (): string | null => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('token');
  };

  const setAuthToken = (token: string): void => {
    if (typeof window === 'undefined') return;
    localStorage.setItem('token', token);
    setIsAuthenticated(true);
    setIsGuest(false);
  };

  const clearAuthToken = (): void => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem('token');
    setIsAuthenticated(false);
    setIsGuest(false);
  };

  // Guest mode management
  const setGuestMode = (guest: boolean): void => {
    setIsGuest(guest);
    setIsAuthenticated(false);
    if (guest) {
      localStorage.setItem('climbly_skip_guest', 'true');
    } else {
      localStorage.removeItem('climbly_skip_guest');
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      signIn, 
      signInWithEmail, 
      signUpWithEmail,
      sendPasswordReset,
      signOutUser,
      setRememberMe,
      hasSkippedAuth,
      clearSkipFlag,
      isAuthenticated,
      isGuest,
      getAuthToken,
      setAuthToken,
      clearAuthToken,
      setGuestMode
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
