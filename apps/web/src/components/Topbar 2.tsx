'use client';

import { useState } from 'react';
import { Bell, User, LogOut, Settings } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { usePathname } from 'next/navigation';

export default function Topbar() {
  const [showDropdown, setShowDropdown] = useState(false);
  const { user, signOutUser, hasSkippedAuth } = useAuth();
  const pathname = usePathname();

  const getPageTitle = () => {
    const route = pathname.split('/')[1];
    if (route === 'dashboard') return 'Dashboard';
    if (route === 'ats') return 'ATS Scanner';
    if (route === 'portfolio') return 'Portfolio Generator';
    if (route === 'emails') return 'AI Email Generator';
    if (route === 'referrals') return 'Referral Marketplace';
    if (route === 'tracker') return 'Job Tracker';
    if (route === 'profile') return 'Profile';
    return 'Dashboard';
  };

  const handleLogout = async () => {
    if (hasSkippedAuth()) {
      // Clear skip flag and redirect to login
      localStorage.removeItem('climbly_skip_guest');
      window.location.href = '/';
    } else {
      await signOutUser();
      window.location.href = '/';
    }
  };

  return (
    <div className="fixed top-0 left-0 right-0 h-16 bg-white border-b border-gray-200 z-50">
      <div className="flex items-center justify-between h-full px-6">
        {/* Left: Logo */}
        <div className="flex items-center">
          <div className="w-8 h-8 bg-gradient-to-br from-indigo-600 to-indigo-700 rounded-lg flex items-center justify-center mr-3">
            <span className="text-white font-bold text-sm">C</span>
          </div>
          <span className="text-xl font-bold text-gray-900">Climbly</span>
        </div>

        {/* Center: Page Title */}
        <div className="flex-1 flex justify-center">
          <h1 className="text-lg font-semibold text-gray-700">{getPageTitle()}</h1>
        </div>

        {/* Right: Notifications & User Menu */}
        <div className="flex items-center space-x-4">
          {/* Notification Bell */}
          <button className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
            <Bell size={20} />
          </button>

          {/* User Avatar & Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="flex items-center space-x-2 p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <div className="w-8 h-8 bg-gradient-to-br from-indigo-600 to-indigo-700 rounded-full flex items-center justify-center">
                <User size={16} className="text-white" />
              </div>
            </button>

            {/* Dropdown Menu */}
            {showDropdown && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                <div className="px-4 py-2 text-sm text-gray-700 border-b border-gray-100">
                  {user ? (
                    <div>
                      <div className="font-medium">{user.displayName || user.email}</div>
                      <div className="text-gray-500 text-xs">Signed in</div>
                    </div>
                  ) : (
                    <div>
                      <div className="font-medium">Guest User</div>
                      <div className="text-gray-500 text-xs">Skip mode</div>
                    </div>
                  )}
                </div>
                
                <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-2">
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
