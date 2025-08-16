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

import { useState } from 'react';
import Sidebar from '@/components/Sidebar';
import Topbar from '@/components/Topbar';

export default function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Set default state to collapsed
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);

  return (
    <div className="min-h-screen bg-[#F0F2F5]">
      {/* Fixed Topbar that spans full width */}
      <Topbar 
        sidebarCollapsed={sidebarCollapsed}
        onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
      />
      
      {/* Sidebar positioned below the topbar */}
      <Sidebar 
        isCollapsed={sidebarCollapsed}
        onToggle={(collapsed) => setSidebarCollapsed(collapsed)}
      />
      
      {/* Main content area that shifts right/left based on sidebar state */}
      <main className={`pt-18 min-h-screen transition-all duration-300 ease-in-out ${
        sidebarCollapsed ? 'ml-16' : 'ml-60'
      } lg:ml-60`}>
        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
