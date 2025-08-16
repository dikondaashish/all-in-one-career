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
  signIn: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string) => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
  signOutUser: () => Promise<void>;
  setRememberMe: (remember: boolean) => Promise<void>;
  hasSkippedAuth: () => boolean;
  clearSkipFlag: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signIn = async () => {
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error('Google sign in error:', error);
      throw error;
    }
  };

  const signInWithEmail = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error: any) {
      console.error('Email sign in error:', error);
      if (error.code === 'auth/invalid-credential') {
        throw new Error('Incorrect email or password');
      } else if (error.code === 'auth/user-not-found') {
        throw new Error('No account found with this email');
      } else if (error.code === 'auth/wrong-password') {
        throw new Error('Incorrect password');
      } else if (error.code === 'auth/too-many-requests') {
        throw new Error('Too many failed attempts. Please try again later');
      } else {
        throw new Error('Failed to sign in. Please try again');
      }
    }
  };

  const signUpWithEmail = async (email: string, password: string) => {
    try {
      await createUserWithEmailAndPassword(auth, email, password);
    } catch (error: any) {
      console.error('Email sign up error:', error);
      if (error.code === 'auth/email-already-in-use') {
        throw new Error('An account with this email already exists');
      } else if (error.code === 'auth/weak-password') {
        throw new Error('Password should be at least 6 characters');
      } else if (error.code === 'auth/invalid-email') {
        throw new Error('Please enter a valid email address');
      } else {
        throw new Error('Failed to create account. Please try again');
      }
    }
  };

  const sendPasswordReset = async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error: any) {
      console.error('Password reset error:', error);
      if (error.code === 'auth/user-not-found') {
        throw new Error('No account found with this email');
      } else if (error.code === 'auth/invalid-email') {
        throw new Error('Please enter a valid email address');
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
      await signOut(auth);
    } catch (error) {
      console.error('Sign out error:', error);
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
      clearSkipFlag
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
