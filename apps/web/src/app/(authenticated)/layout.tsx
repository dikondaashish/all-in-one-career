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
import Sidebar from '@/components/Sidebar';
import Topbar from '@/components/Topbar';

// Force dynamic rendering to prevent static generation issues with theme system
export const dynamic = 'force-dynamic';

export default function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Set default state to collapsed
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);

  // Debug logging to verify state changes
  useEffect(() => {
    console.log('Sidebar state changed:', sidebarCollapsed ? 'collapsed' : 'expanded');
  }, [sidebarCollapsed]);

  const handleSidebarToggle = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

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
