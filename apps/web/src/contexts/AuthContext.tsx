'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { 
  User, 
  signInWithPopup, 
  signInWithRedirect,
  getRedirectResult,
  signOut, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence
} from 'firebase/auth';
import { auth, provider } from '@/lib/firebase';
import { useUserStore } from '@/stores/useUserStore';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  isGuest: boolean;
  profileImageUrl: string | null;
  signIn: () => Promise<void>;
  signInSilently: () => Promise<boolean>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string, name?: string, profileImage?: File) => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
  signOutUser: () => Promise<void>;
  setRememberMe: (remember: boolean) => Promise<void>;
  hasSkippedAuth: () => boolean;
  clearSkipFlag: () => void;
  setGuestMode: (isGuest: boolean) => void;
  getAuthToken: () => string | null;
  setAuthToken: (token: string) => void;
  clearAuthToken: () => void;
  updateProfileImage: (imageUrl: string) => void;
  isFallbackAuth: () => boolean;
  retryBackendConnection: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isGuest, setIsGuest] = useState(false);
  const [profileImageUrl, setProfileImageUrl] = useState<string | null>(null);

  useEffect(() => {
    // Handle redirect result on page load
    const handleRedirectResult = async () => {
      try {
        const result = await getRedirectResult(auth);
        if (result) {
          console.log('Google redirect sign-in successful');
          // Process the successful redirect result
          await processAuthResult(result.user);
        }
      } catch (error) {
        console.error('Redirect result error:', error);
      }
    };

    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      setUser(user);
      setIsAuthenticated(!!user);
      setLoading(false);

      // Populate Zustand store on initial auth state (page refresh/restore)
      if (user) {
        try {
          useUserStore.getState().setUser({
            id: user.uid,
            name: user.displayName || user.email?.split('@')[0] || 'User',
            email: user.email || '',
            avatarUrl: user.photoURL || '',
            profileImage: user.photoURL || ''
          });
        } catch {}
      } else {
        try { useUserStore.getState().clearUser(); } catch {}
      }
    });

    // Check for redirect result on component mount
    handleRedirectResult();

    return unsubscribe;
  }, []);

  // Helper function to process authentication result (shared between popup and redirect)
  const processAuthResult = async (user: User) => {
    try {
      // Get Firebase ID token
      const firebaseToken = await user.getIdToken();
      
      // Call backend to get JWT token with optimized error handling
      const API_BASE_URL = process.env.NODE_ENV === 'production' 
        ? 'https://all-in-one-career-api.onrender.com'
        : 'http://localhost:4000';
      
      console.log('Processing auth result for user:', user.email);
      
      // Streamlined backend auth - remove redundant health check
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firebaseToken,
          email: user.email,
          photoURL: user.photoURL,
        }),
        // Reduced timeout for faster response
        signal: AbortSignal.timeout(10000) // 10 seconds
      });

      if (!response.ok) {
        // If backend fails, use fallback auth but don't throw error
        console.log('Backend auth failed, using fallback authentication');
        await signInWithFallback(user);
        return;
      }

      const { token } = await response.json();
      
      // Store JWT token in localStorage
      setAuthToken(token);
      
      // Populate Zustand store with user data
      useUserStore.getState().setUser({
        id: user.uid,
        name: user.displayName || 'User',
        email: user.email || '',
        avatarUrl: user.photoURL || '',
        profileImage: user.photoURL || ''
      });
      
      console.log('Authentication successful with backend');
      
    } catch (error: unknown) {
      console.error('Auth processing error:', error);
      // Use fallback auth instead of throwing error
      await signInWithFallback(user);
    }
  };

  const signIn = async () => {
    try {
      console.log('Starting optimized Google sign-in...');
      
      // Check if this is a mobile device or if pop-ups are likely to be blocked
      const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      const isChrome = /Chrome/i.test(navigator.userAgent);
      
      // For Chrome and mobile devices, use redirect for better UX (no pop-ups)
      if (isChrome || isMobile) {
        console.log('Using redirect flow for better UX (no pop-ups)');
        await signInWithRedirect(auth, provider);
        // The redirect will happen and processAuthResult will be called on return
        return;
      }
      
      // For other browsers, try popup first with fallback to redirect
      try {
        console.log('Attempting popup sign-in...');
        const result = await signInWithPopup(auth, provider);
        await processAuthResult(result.user);
        console.log('Popup sign-in successful');
      } catch (popupError: unknown) {
        console.log('Popup failed, falling back to redirect:', popupError);
        
        // If popup fails (blocked, etc.), use redirect
        if (popupError instanceof Error && 
            (popupError.message.includes('popup-blocked') || 
             popupError.message.includes('popup-closed') ||
             popupError.message.includes('auth/popup-blocked'))) {
          console.log('Popup was blocked, using redirect instead');
          await signInWithRedirect(auth, provider);
          return;
        }
        
        // For other popup errors, still try redirect as fallback
        throw popupError;
      }
      
    } catch (error: unknown) {
      console.error('Google sign-in error:', error);
      
      // Provide user-friendly error messages
      if (error instanceof Error) {
        if (error.message.includes('popup-closed') || error.message.includes('cancelled')) {
          throw new Error('Sign-in was cancelled. Please try again.');
        }
        if (error.message.includes('network-request-failed')) {
          throw new Error('Network error. Please check your connection and try again.');
        }
        if (error.message.includes('too-many-requests')) {
          throw new Error('Too many sign-in attempts. Please wait a moment and try again.');
        }
      }
      
      throw error instanceof Error ? error : new Error('Failed to sign in with Google. Please try again.');
    }
  };

  // Silent sign-in for returning users (check if already authenticated)
  const signInSilently = async (): Promise<boolean> => {
    try {
      const currentUser = auth.currentUser;
      if (currentUser) {
        console.log('User already authenticated, processing silently...');
        await processAuthResult(currentUser);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Silent sign-in failed:', error);
      return false;
    }
  };

  const signInWithEmail = async (email: string, password: string) => {
    try {
      // Firebase authentication first
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Use the shared processAuthResult function
      await processAuthResult(user);
      console.log('Email login successful');
      
    } catch (err: unknown) {
      console.error('Email sign in error:', err);
      
      // Handle Firebase auth errors
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

  const signUpWithEmail = async (email: string, password: string, name?: string, profileImage?: File) => {
    try {
      // STEP 2: Firebase account creation first
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Get Firebase ID token
      const firebaseToken = await user.getIdToken();
      
      // Handle profile image upload if provided
      let profileImageUrl: string | null = null;
      if (profileImage) {
        try {
          // For now, we'll convert the image to a data URL
          // In production, you'd want to upload to a cloud storage service
          const reader = new FileReader();
          profileImageUrl = await new Promise((resolve, reject) => {
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(profileImage);
          });
        } catch (uploadError) {
          console.warn('Failed to process profile image:', uploadError);
          // Continue without profile image
        }
      }
      
      // Call backend to get JWT token
      const API_BASE_URL = process.env.NODE_ENV === 'production' 
        ? 'https://all-in-one-career.onrender.com'
        : 'http://localhost:4000';
      
      // Test backend connectivity first
      try {
        const healthController = new AbortController();
        const healthTimeout = setTimeout(() => healthController.abort(), 10000);
        
        const healthResponse = await fetch(`${API_BASE_URL}/health`, {
          signal: healthController.signal
        });
        
        clearTimeout(healthTimeout);
        
        if (!healthResponse.ok) {
          throw new Error('Backend health check failed');
        }
      } catch (healthError: unknown) {
        console.error('Backend health check failed:', healthError);
        throw new Error('Cannot connect to server. Please check your internet connection and try again.');
      }
        
      // Now attempt the actual signup with timeout
      const authController = new AbortController();
      const authTimeout = setTimeout(() => authController.abort(), 15000);
      
      const response = await fetch(`${API_BASE_URL}/api/auth/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firebaseToken,
          email: user.email,
          name: name || user.displayName || user.email?.split('@')[0] || 'User',
          profileImage: profileImageUrl
        }),
        signal: authController.signal
      });
      
      clearTimeout(authTimeout);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Backend auth error:', response.status, errorData);
        
        if (response.status === 500) {
          throw new Error('Server error occurred. Please try again later.');
        } else if (response.status === 400) {
          throw new Error('Invalid signup data. Please check your information and try again.');
        } else if (response.status === 409) {
          throw new Error('An account with this email already exists.');
        } else {
          throw new Error(`Signup failed: ${response.status}. Please try again.`);
        }
      }

      const { token } = await response.json();
      
      // Store JWT token in localStorage
      setAuthToken(token);
      
      // Populate Zustand store with user data
      useUserStore.getState().setUser({
        id: user.uid,
        name: name || user.displayName || user.email?.split('@')[0] || 'User',
        email: user.email || '',
        avatarUrl: profileImageUrl || '',
        profileImage: profileImageUrl || ''
      });
      
      console.log('Signup successful, JWT token stored, Zustand store populated');
      
    } catch (err: unknown) {
      console.error('Email sign up error:', err);
      
      // Handle timeout errors
      if (err instanceof Error && err.name === 'AbortError') {
        throw new Error('Request timed out. Please try again.');
      }
      
      // Handle network errors
      if (err instanceof TypeError && err.message === 'Failed to fetch') {
        throw new Error('Cannot connect to server. Please check your internet connection and try again.');
      }
      
      // Handle Firebase auth errors
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
      
      // Clear Zustand store
      useUserStore.getState().clearUser();
      
    } catch (error) {
      console.error('Sign out error:', error);
      // Force clear even if Firebase signOut fails
      clearAuthToken();
      setGuestMode(false);
      
      // Clear Zustand store
      useUserStore.getState().clearUser();
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

  // Fallback authentication when backend is unavailable
  const signInWithFallback = async (user: { uid: string; displayName: string | null; email: string | null; photoURL: string | null }) => {
    console.log('Using fallback authentication - backend unavailable');
    
    // Generate a temporary local token for offline use
    const tempToken = `temp_${user.uid}_${Date.now()}`;
    
    // Store temporary token
    setAuthToken(tempToken);
    
    // Populate Zustand store with user data
    useUserStore.getState().setUser({
      id: user.uid,
      name: user.displayName || 'User',
      email: user.email || '',
      avatarUrl: user.photoURL || '',
      profileImage: user.photoURL || ''
    });
    
    // Store fallback flag
    localStorage.setItem('climbly_fallback_auth', 'true');
    
    console.log('Fallback authentication successful - user can continue with limited functionality');
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

  const updateProfileImage = (imageUrl: string): void => {
    setProfileImageUrl(imageUrl);

    // Also update Zustand store for global sync
    try { useUserStore.getState().updateProfileImage(imageUrl); } catch {}
    
    // Also update the Firebase user's photoURL if available
    if (user && user.photoURL !== imageUrl) {
      // Update the local user state to reflect the new photo
      setUser(prevUser => prevUser ? { ...prevUser, photoURL: imageUrl } : null);
    }
  };

  // Check if user is in fallback authentication mode
  const isFallbackAuth = (): boolean => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem('climbly_fallback_auth') === 'true';
  };

  // Retry backend connection and upgrade from fallback to full auth
  const retryBackendConnection = async (): Promise<boolean> => {
    try {
      const API_BASE_URL = process.env.NODE_ENV === 'production' 
        ? 'https://all-in-one-career.onrender.com'
        : 'http://localhost:4000';
      
      // Test backend connectivity
      const healthResponse = await fetch(`${API_BASE_URL}/health`);
      if (!healthResponse.ok) {
        throw new Error('Backend still unavailable');
      }
      
      // If we get here, backend is available
      const currentUser = auth.currentUser;
      if (currentUser) {
        // Attempt to authenticate with backend
        const firebaseToken = await currentUser.getIdToken();
        const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            firebaseToken,
            email: currentUser.email,
            photoURL: currentUser.photoURL,
          }),
        });
        
        if (response.ok) {
          const { token } = await response.json();
          setAuthToken(token);
          localStorage.removeItem('climbly_fallback_auth');
          console.log('Successfully upgraded from fallback to full authentication');
          return true;
        }
      }
      
      return false;
    } catch (error) {
      console.error('Backend connection retry failed:', error);
      return false;
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      signIn,
      signInSilently, 
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
      setGuestMode,
      updateProfileImage,
      profileImageUrl,
      isFallbackAuth,
      retryBackendConnection
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
