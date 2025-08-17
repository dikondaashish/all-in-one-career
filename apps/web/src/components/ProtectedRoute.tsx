'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import GlobalLoader from './GlobalLoader';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  redirectTo?: string;
}

export default function ProtectedRoute({ 
  children, 
  requireAuth = false, 
  redirectTo = '/'
}: ProtectedRouteProps) {
  const { isAuthenticated, isGuest, loading } = useAuth();
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    if (!loading) {
      // Check if user has access to this route
      if (requireAuth && !isAuthenticated && !isGuest) {
        // User is not authenticated and not a guest, redirect to login
        console.log('User not authenticated, redirecting to login');
        router.push(redirectTo);
        return;
      }
      
      // User has access, show content
      setIsChecking(false);
    }
  }, [loading, isAuthenticated, isGuest, requireAuth, redirectTo, router]);

  // Show loading while checking auth state
  if (loading || isChecking) {
    return <GlobalLoader message="Checking authentication..." />;
  }

  return <>{children}</>;
}
