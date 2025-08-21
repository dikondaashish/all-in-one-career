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
import { useUserStore } from '@/stores/useUserStore';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  isGuest: boolean;
  profileImageUrl: string | null;
  signIn: () => Promise<void>;
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

  // Check Firebase configuration on mount
  useEffect(() => {
    // Firebase configuration is now handled in next.config.js with fallback values
    // This prevents the configuration errors from blocking the app
  }, []);

  // Restore user state from JWT token on mount
  useEffect(() => {
    const restoreUserFromToken = async () => {
      try {
        const token = localStorage.getItem('token');
        if (token && !user) {
          console.log('JWT token found, attempting to restore user state...');
          
          // Set a timeout for the restoration process
          const restorationTimeout = setTimeout(() => {
            console.log('JWT restoration timeout, clearing token');
            localStorage.removeItem('token');
            setIsAuthenticated(false);
            setIsGuest(false);
          }, 10000); // 10 second timeout
          
          // Validate token with backend to get user info
          try {
            const API_BASE_URL = process.env.NODE_ENV === 'production' 
              ? 'https://all-in-one-career-api.onrender.com'
              : 'http://localhost:4000';
            
            const response = await fetch(`${API_BASE_URL}/api/auth/validate`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              }
            });
            
            clearTimeout(restorationTimeout);
            
            if (response.ok) {
              const userData = await response.json();
              console.log('JWT token validated, user data:', userData);
              
              // Create a proper user object from the validated data
              const restoredUser = {
                uid: userData.uid,
                email: userData.email,
                displayName: userData.name || userData.email?.split('@')[0] || 'User',
                photoURL: userData.profileImage || null
              } as User;
              
              setUser(restoredUser);
              setIsAuthenticated(true);
              setIsGuest(false);
              
              // Populate Zustand store
              useUserStore.getState().setUser({
                id: restoredUser.uid,
                name: restoredUser.displayName || 'User',
                email: restoredUser.email || '',
                avatarUrl: restoredUser.photoURL || '',
                profileImage: restoredUser.photoURL || ''
              });
              
              console.log('User state fully restored from JWT token');
            } else {
              console.log('JWT token invalid, clearing token');
              localStorage.removeItem('token');
              setIsAuthenticated(false);
              setIsGuest(false);
            }
          } catch (validationError) {
            clearTimeout(restorationTimeout);
            console.log('Could not validate JWT token, using fallback restoration:', validationError);
            
            // Fallback: create a basic user state to prevent redirect loops
            // This allows the user to stay on the dashboard while we try to restore Firebase state
            setIsAuthenticated(true);
            setIsGuest(false);
            
            // Don't set a mock user, let Firebase handle the actual user state
            console.log('Using fallback authentication state');
          }
        }
      } catch (error) {
        console.error('Error restoring user from token:', error);
      }
    };
    
    restoreUserFromToken();
  }, [user]);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user: User | null) => {
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

    return unsubscribe;
  }, []);

  const signIn = async () => {
    // Check if Firebase is properly configured
    if (!auth || !provider || typeof auth.onAuthStateChanged !== 'function') {
      throw new Error('Firebase is not properly configured. Please check your environment variables and try again.');
    }
    
    // Check if Firebase has the required methods
    if (typeof signInWithPopup !== 'function') {
      throw new Error('Firebase authentication methods are not available. Please check your Firebase configuration.');
    }
    
    const maxRetries = 2;
    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`Google sign-in attempt ${attempt}/${maxRetries}`);
        
        // STEP 2: Google Firebase authentication first
        const result = await signInWithPopup(auth, provider);
        const user = result.user;
        
        // Get Firebase ID token
        const firebaseToken = await user.getIdToken();
        
        // Call backend to get JWT token
        const API_BASE_URL = process.env.NODE_ENV === 'production' 
          ? 'https://all-in-one-career-api.onrender.com'
          : 'http://localhost:4000';
        
        console.log('Attempting to connect to backend at:', API_BASE_URL);
        
        // Test backend connectivity first with timeout
        let healthCheckPassed = false;
        try {
          const healthController = new AbortController();
          const healthTimeout = setTimeout(() => healthController.abort(), 10000); // 10 second timeout
          
          const healthResponse = await fetch(`${API_BASE_URL}/health`, {
            signal: healthController.signal
          });
          
          clearTimeout(healthTimeout);
          
          if (healthResponse.ok) {
            console.log('Backend health check passed:', healthResponse.status);
            healthCheckPassed = true;
          } else {
            console.error('Backend health check failed with status:', healthResponse.status);
          }
        } catch (healthError: unknown) {
          console.error('Backend health check failed:', healthError);
          if (healthError instanceof Error && healthError.name === 'AbortError') {
            throw new Error('Backend server is not responding. Please try again later.');
          }
          throw new Error('Cannot connect to backend server. Please check your internet connection and try again.');
        }
        
        if (!healthCheckPassed) {
          // If backend health check fails, offer fallback authentication
          console.log('Backend unavailable, offering fallback authentication');
          await signInWithFallback(user);
          return;
        }
          
        // Now attempt the actual authentication
        const authController = new AbortController();
        const authTimeout = setTimeout(() => authController.abort(), 15000); // 15 second timeout for auth
        
        const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            firebaseToken,
            email: user.email,
            photoURL: user.photoURL, // Send Google profile photo URL
          }),
          signal: authController.signal
        });
        
        clearTimeout(authTimeout);

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error('Backend auth error:', response.status, errorData);
          
          if (response.status === 500) {
            throw new Error('Server error occurred. Please try again later.');
          } else if (response.status === 401) {
            throw new Error('Authentication failed. Please try again.');
          } else if (response.status === 404) {
            throw new Error('Authentication service not found. Please contact support.');
          } else {
            throw new Error(`Authentication failed: ${response.status}. Please try again.`);
          }
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
        
        console.log('Google login successful, JWT token stored, Zustand store populated');
        return; // Success, exit retry loop
        
      } catch (error: unknown) {
        console.error(`Google sign in error (attempt ${attempt}):`, error);
        lastError = error instanceof Error ? error : new Error('Unknown error occurred');
        
        // Don't retry for certain errors
        if (error instanceof Error) {
          if (error.message.includes('popup-closed') || error.message.includes('cancelled')) {
            throw error; // Don't retry user-cancelled actions
          }
          if (error.message.includes('auth/popup-closed-by-user')) {
            throw error; // Don't retry user-cancelled popup
          }
        }
        
        // If this is the last attempt, throw the error
        if (attempt === maxRetries) {
          break;
        }
        
        // Wait before retrying (exponential backoff)
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 3000);
        console.log(`Waiting ${delay}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    // If we get here, all retries failed
    console.error('All Google sign-in attempts failed');
    
    // Provide more specific error messages for common issues
    if (lastError instanceof TypeError && lastError.message === 'Failed to fetch') {
      throw new Error('Cannot connect to server. Please check your internet connection and try again.');
    }
    
    if (lastError instanceof Error && lastError.name === 'AbortError') {
      throw new Error('Request timed out. Please try again.');
    }
    
    throw lastError || new Error('Failed to sign in with Google. Please try again.');
  };

  const signInWithEmail = async (email: string, password: string) => {
    // Check if Firebase is properly configured
    if (!auth || typeof auth.onAuthStateChanged !== 'function') {
      throw new Error('Firebase is not properly configured. Please check your environment variables and try again.');
    }
    
    // Check if Firebase has the required methods
    if (typeof signInWithEmailAndPassword !== 'function') {
      throw new Error('Firebase authentication methods are not available. Please check your Firebase configuration.');
    }
    
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
        
      // Now attempt the actual authentication with timeout
      const authController = new AbortController();
      const authTimeout = setTimeout(() => authController.abort(), 15000);
      
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firebaseToken,
          email: user.email,
        }),
        signal: authController.signal
      });
      
      clearTimeout(authTimeout);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Backend auth error:', response.status, errorData);
        
        if (response.status === 500) {
          throw new Error('Server error occurred. Please try again later.');
        } else if (response.status === 401) {
          throw new Error('Authentication failed. Please try again.');
        } else if (response.status === 404) {
          throw new Error('Authentication service not found. Please contact support.');
        } else {
          throw new Error(`Authentication failed: ${response.status}. Please try again.`);
        }
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
      
      console.log('Login successful, JWT token stored, Zustand store populated');
      
    } catch (err: unknown) {
      console.error('Email sign in error:', err);
      
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
        ? 'https://all-in-one-career-api.onrender.com'
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
        ? 'https://all-in-one-career-api.onrender.com'
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
