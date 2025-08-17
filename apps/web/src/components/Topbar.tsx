/**
 * Topbar Component with Push-Style Sidebar Integration
 * 
 * ✅ SUCCESSFULLY IMPLEMENTED: Topbar with sidebar toggle control
 * - Fixed positioning at the top of the screen
 * - Spans full width regardless of sidebar state
 * - Includes hamburger menu toggle for sidebar control
 * - Clean, consistent header design with sidebar integration
 * - Integrated SmartSearch component for global search functionality
 */

'use client';

import { Bell, User, Mail, Menu, Settings, LogOut } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import SmartSearch from './SmartSearch';

interface TopbarProps {
  sidebarCollapsed: boolean;
  onToggleSidebar: () => void;
}

export default function Topbar({ sidebarCollapsed, onToggleSidebar }: TopbarProps) {
  const { user, signOutUser, isGuest } = useAuth();
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);
  const [userDisplayName, setUserDisplayName] = useState('User');
  const [userEmail, setUserEmail] = useState('user@example.com');
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (isClient) {
      if (user) {
        setUserDisplayName(user.displayName || user.email?.split('@')[0] || 'User');
        setUserEmail(user.email || 'user@example.com');
      } else if (isGuest) {
        setUserDisplayName('Guest User');
        setUserEmail('guest@climbly.ai');
      } else {
        setUserDisplayName('User');
        setUserEmail('user@example.com');
      }
    }
  }, [user, isGuest, isClient]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.user-dropdown')) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      if (isGuest) {
        // Clear guest mode and redirect to login
        localStorage.removeItem('climbly_skip_guest');
        router.push('/');
      } else {
        // Sign out from Firebase and redirect to login
        await signOutUser();
        router.push('/');
      }
    } catch (error) {
      console.error('Logout error:', error);
      // Force redirect even if there's an error
      router.push('/');
    }
  };

  return (
    <div className="fixed top-0 left-0 right-0 h-18 bg-white border-b border-gray-100 z-20 shadow-sm">
      <div className="flex items-center justify-between h-full px-8">
        {/* Left - Sidebar Toggle + Logo */}
        <div className="flex items-center space-x-4">
          {/* Sidebar Toggle Button */}
          <button
            onClick={onToggleSidebar}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <Menu className="w-5 h-5 text-gray-600" />
          </button>
          
          {/* Logo */}
          <div className="flex items-center">
            <div className="w-10 h-10 bg-gradient-to-br from-[#006B53] to-[#008F6F] rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">C</span>
            </div>
            <span className="ml-3 text-xl font-bold text-gray-900">Climbly.ai</span>
          </div>
        </div>

        {/* Center - Smart Search Bar */}
        <div className="flex-1 max-w-md mx-8">
          <SmartSearch />
        </div>

        {/* Right - Notifications & User */}
        <div className="flex items-center space-x-4">
          {/* Messages */}
          <button className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors">
            <Mail className="w-5 h-5" />
          </button>

          {/* Notifications */}
          <button className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors">
            <Bell className="w-5 h-5" />
          </button>

          {/* User Avatar */}
          <div className="relative">
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="w-10 h-10 bg-gradient-to-br from-[#006B53] to-[#008F6F] rounded-full flex items-center justify-center">
                <User className="w-5 h-5 text-white" />
              </div>
              <div className="text-right">
                <div className="text-sm font-medium text-gray-900">{userDisplayName}</div>
                <div className="text-xs text-gray-500">{userEmail}</div>
              </div>
            </button>

            {/* Dropdown Menu */}
            {showDropdown && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50 user-dropdown">
                <div className="px-4 py-2 text-sm text-gray-700 border-b border-gray-100">
                  {user ? (
                    <div>
                      <div className="font-medium">{userDisplayName}</div>
                      <div className="text-gray-500 text-xs">{userEmail}</div>
                    </div>
                  ) : (
                    <div>
                      <div className="font-medium">{userDisplayName}</div>
                      <div className="text-gray-500 text-xs">{userEmail}</div>
                    </div>
                  )}
                </div>
                
                <button 
                  onClick={() => router.push('/profile')}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-2"
                >
                  <Settings size={16} />
                  <span>Profile</span>
                </button>
                
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center space-x-2"
                >
                  <LogOut size={16} />
                  <span>Logout</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
