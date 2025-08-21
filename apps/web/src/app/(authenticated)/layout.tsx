/**
 * Authenticated Layout with Push-Style Sidebar
 * 
 * ✅ SUCCESSFULLY IMPLEMENTED: Push-style sidebar layout system
 * - Manages sidebar collapsed/expanded state
 * - Main content area shifts right/left based on sidebar state
 * - Smooth transitions and animations
 * - Proper state management between Sidebar, Topbar, and Layout components
 * - Dashboard content dynamically resizes based on sidebar state
 * - Push behavior: content shifts right when sidebar expands, left when collapsed
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Sidebar from '@/components/Sidebar';
import Topbar from '@/components/Topbar';
import { ToastProvider } from '@/components/notifications/ToastContainer';
import { ConfirmationProvider } from '@/components/ui/ConfirmationDialog';

// Force dynamic rendering to prevent static generation issues with theme system
export const dynamic = 'force-dynamic';

export default function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading, isGuest } = useAuth();
  const router = useRouter();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);

  // Check authentication at layout level
  useEffect(() => {
    if (!loading) {
      // Check if user has JWT token as fallback
      const hasJWTToken = localStorage.getItem('token');
      
      if (!user && !isGuest && !hasJWTToken) {
        // User is not authenticated, not in guest mode, and has no JWT token
        console.log('Unauthenticated user redirected from authenticated layout');
        router.push('/');
      } else if (hasJWTToken && !user && !loading) {
        // User has JWT token but Firebase user is not loaded yet
        // This is normal during JWT restoration, don't redirect
        console.log('JWT token found, waiting for user state restoration...');
      }
    }
  }, [user, loading, isGuest, router]);

  // Debug logging to verify state changes
  useEffect(() => {
    console.log('Sidebar state changed:', sidebarCollapsed ? 'collapsed' : 'expanded');
  }, [sidebarCollapsed]);

  const handleSidebarToggle = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  // Show loading while checking auth state or during JWT restoration
  if (loading || (localStorage.getItem('token') && !user && !isGuest)) {
    return (
      <div className="min-h-screen bg-[#F0F2F5] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#006B53] mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // If user is not authenticated and not in guest mode, don't render layout
  if (!user && !isGuest && !localStorage.getItem('token')) {
    return null; // Will redirect in useEffect
  }

  return (
    <ConfirmationProvider>
      <ToastProvider>
        <div className="min-h-screen bg-[#F0F2F5]">
          {/* Fixed Topbar that spans full width */}
          <Topbar 
            sidebarCollapsed={sidebarCollapsed}
            onToggleSidebar={handleSidebarToggle}
          />
          
          {/* Sidebar positioned below the topbar */}
          <Sidebar 
            isCollapsed={sidebarCollapsed}
            onToggle={setSidebarCollapsed}
          />
          
          {/* Main content area that shifts right/left based on sidebar state */}
          <main className={`pt-18 min-h-screen transition-all duration-300 ease-in-out ${
            sidebarCollapsed ? 'ml-16' : 'ml-60'
          }`}>
            <div className="p-8">
              {children}
            </div>
          </main>
        </div>
      </ToastProvider>
    </ConfirmationProvider>
  );
}
