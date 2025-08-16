'use client';

import { Bell, Search, User, Mail } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useState, useEffect } from 'react';

export default function Topbar() {
  const { user, hasSkippedAuth } = useAuth();
  const [isClient, setIsClient] = useState(false);
  const [userDisplayName, setUserDisplayName] = useState('User');
  const [userEmail, setUserEmail] = useState('user@example.com');

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (isClient) {
      if (user) {
        setUserDisplayName(user.displayName || user.email?.split('@')[0] || 'User');
        setUserEmail(user.email || 'user@example.com');
      } else if (hasSkippedAuth()) {
        setUserDisplayName('Guest User');
        setUserEmail('guest@climbly.ai');
      } else {
        setUserDisplayName('User');
        setUserEmail('user@example.com');
      }
    }
  }, [user, hasSkippedAuth, isClient]);

  return (
    <div className="fixed top-0 left-60 right-0 h-18 bg-white border-b border-gray-100 z-20 shadow-sm">
      <div className="flex items-center justify-between h-full px-8">
        {/* Left - Logo */}
        <div className="flex items-center">
          <div className="w-10 h-10 bg-gradient-to-br from-[#006B53] to-[#008F6F] rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-xl">C</span>
          </div>
          <span className="ml-3 text-xl font-bold text-gray-900">Climbly.ai</span>
        </div>

        {/* Center - Search Bar */}
        <div className="flex-1 max-w-md mx-8">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search task"
              className="w-full pl-12 pr-20 py-3 bg-gray-50 border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-[#006B53] focus:border-transparent text-sm"
            />
            <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
              <span className="px-3 py-1 bg-gray-200 text-gray-600 text-xs rounded-full font-medium">⌘ F</span>
            </div>
          </div>
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
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-[#006B53] to-[#008F6F] rounded-full flex items-center justify-center">
              <User className="w-5 h-5 text-white" />
            </div>
            <div className="text-right">
              <div className="text-sm font-medium text-gray-900">{userDisplayName}</div>
              <div className="text-xs text-gray-500">{userEmail}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
