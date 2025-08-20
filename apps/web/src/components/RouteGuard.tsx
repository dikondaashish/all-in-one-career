'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Toast from './Toast';

interface RouteGuardProps {
  children: React.ReactNode;
  restrictedForGuests?: boolean;
  redirectTo?: string;
}

export default function RouteGuard({ 
  children, 
  restrictedForGuests = false, 
  redirectTo = '/'
}: RouteGuardProps) {
  const { isGuest, loading } = useAuth();
  const router = useRouter();
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    if (!loading && restrictedForGuests && isGuest) {
      // Guest user trying to access restricted route
      console.log('Guest user redirected from restricted route');
      setShowToast(true);
      // Redirect after showing toast
      setTimeout(() => {
        router.push(redirectTo);
      }, 2000);
    }
  }, [isGuest, loading, restrictedForGuests, redirectTo, router]);

  // Show loading while checking auth state
  if (loading) {
    return (
      <div className="min-h-screen bg-[#F0F2F5] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#006B53] mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // If route is restricted for guests and user is guest, don't render children
  if (restrictedForGuests && isGuest) {
    return (
      <>
        {showToast && (
          <Toast
            message="Please login or signup to access this feature."
            type="warning"
            duration={2000}
            onClose={() => setShowToast(false)}
          />
        )}
      </>
    );
  }

  return <>{children}</>;
}
