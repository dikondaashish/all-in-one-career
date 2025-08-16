'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

interface AuthenticatedContentProps {
  children: React.ReactNode;
}

export default function AuthenticatedContent({ children }: AuthenticatedContentProps) {
  const { user, loading, hasSkippedAuth } = useAuth();
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    if (!loading) {
      // Check if user is authenticated OR has skipped auth
      if (user || hasSkippedAuth()) {
        setIsAuthorized(true);
      } else {
        // Redirect to login if neither authenticated nor skipped
        router.push('/');
      }
    }
  }, [user, loading, hasSkippedAuth, router]);

  // Show loading while checking auth
  if (loading || !isAuthorized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
