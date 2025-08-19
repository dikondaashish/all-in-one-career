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
    if (!loading && !user && !isGuest) {
      // User is not authenticated and not in guest mode, redirect to login
      console.log('Unauthenticated user redirected from authenticated layout');
      router.push('/');
    }
  }, [user, loading, isGuest, router]);

  // Debug logging to verify state changes
  useEffect(() => {
    console.log('Sidebar state changed:', sidebarCollapsed ? 'collapsed' : 'expanded');
  }, [sidebarCollapsed]);

  const handleSidebarToggle = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

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

  // If user is not authenticated and not in guest mode, don't render layout
  if (!user && !isGuest) {
    return null; // Will redirect in useEffect
  }

  return (
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
  );
}
