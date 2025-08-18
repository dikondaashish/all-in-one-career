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

import { Bell, User as UserIcon, Menu, LogOut, ChevronDown, ChevronRight, Palette, FileText, Lightbulb } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import SmartSearch from './SmartSearch';

interface TopbarProps {
  sidebarCollapsed: boolean;
  onToggleSidebar: () => void;
}

export default function Topbar({ sidebarCollapsed, onToggleSidebar }: TopbarProps) {
  const { user, signOutUser, isGuest, profileImageUrl } = useAuth();
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);
  const [userDisplayName, setUserDisplayName] = useState('User');
  const [userEmail, setUserEmail] = useState('user@example.com');
  const [showDropdown, setShowDropdown] = useState(false);
  const [showThemeSubmenu, setShowThemeSubmenu] = useState(false);
  const [plan, setPlan] = useState<'free' | 'premium'>('free');
  const isPremium = plan === 'premium';
  const SUGGEST_FEATURE_URL = 'https://forms.gle/';

  // Theme handling (light/dark/system)
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>(() => {
    if (typeof window === 'undefined') return 'system';
    return (localStorage.getItem('theme') as 'light' | 'dark' | 'system') || 'system';
  });

  const applyTheme = (next: 'light' | 'dark' | 'system') => {
    setTheme(next);
    if (typeof window === 'undefined') return;
    localStorage.setItem('theme', next);
    const root = document.documentElement;
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const shouldDark = next === 'dark' || (next === 'system' && prefersDark);
    root.classList.toggle('dark', shouldDark);
  };

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Ensure theme is applied on mount and reacts to system changes when in 'system' mode
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!isClient) return;

    const media = window.matchMedia('(prefers-color-scheme: dark)');

    type LegacyMediaQueryList = MediaQueryList & {
      addListener?: (listener: (this: MediaQueryList, ev: MediaQueryListEvent) => void) => void;
      removeListener?: (listener: (this: MediaQueryList, ev: MediaQueryListEvent) => void) => void;
    };

    const applyFromCurrentSetting = () => {
      const stored = (localStorage.getItem('theme') as 'light' | 'dark' | 'system') || theme || 'system';
      const shouldDark = stored === 'dark' || (stored === 'system' && media.matches);
      document.documentElement.classList.toggle('dark', shouldDark);
    };

    applyFromCurrentSetting();

    const handleSystemChange = (e: MediaQueryListEvent) => {
      const current = (localStorage.getItem('theme') as 'light' | 'dark' | 'system') || theme || 'system';
      if (current === 'system') {
        document.documentElement.classList.toggle('dark', e.matches);
      }
    };

    if (typeof media.addEventListener === 'function') {
      media.addEventListener('change', handleSystemChange);
    } else {
      const legacy = media as LegacyMediaQueryList;
      legacy.addListener?.(handleSystemChange);
    }

    return () => {
      if (typeof media.removeEventListener === 'function') {
        media.removeEventListener('change', handleSystemChange);
      } else {
        const legacy = media as LegacyMediaQueryList;
        legacy.removeListener?.(handleSystemChange);
      }
    };
  }, [isClient, theme]);

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

  // Close on ESC
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowDropdown(false);
        setShowThemeSubmenu(false);
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  const handleLogout = async () => {
    try {
      if (isGuest) {
        // STEP 5: Clear guest mode and redirect to login
        localStorage.removeItem('climbly_skip_guest');
        router.push('/');
      } else {
        // STEP 5: Sign out from Firebase and redirect to login
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

        {/* Right - Upgrade, Notifications, User */}
        <div className="flex items-center space-x-3">
          {/* Upgrade badge - only for non-premium */}
          {!isPremium && (
            <button
              onClick={() => router.push('/pricing')}
              className="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold text-white bg-gradient-to-r from-indigo-600 to-blue-600 shadow-sm hover:opacity-95"
              title="Upgrade"
            >
              <span className="text-white">UPGRADE</span>
            </button>
          )}

          {/* Notifications */}
          <button className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors" aria-label="Notifications">
            <Bell className="w-5 h-5" />
          </button>

          {/* User Avatar + Chevron */}
          <div className="relative user-dropdown">
            <button
              onClick={() => setShowDropdown((s) => !s)}
              className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100 transition-colors"
              aria-haspopup="menu"
              aria-expanded={showDropdown}
            >
              <div className="w-10 h-10 bg-gradient-to-br from-[#006B53] to-[#008F6F] rounded-full flex items-center justify-center overflow-hidden">
                {profileImageUrl ? (
                  <img src={profileImageUrl} alt="Profile" className="w-full h-full object-cover" />
                ) : user?.photoURL ? (
                  <img src={user.photoURL as string} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-white font-medium text-sm">{userDisplayName.charAt(0).toUpperCase()}</span>
                )}
              </div>
              <ChevronDown className="w-4 h-4 text-gray-600" />
            </button>

            {/* Dropdown Menu */}
            {showDropdown && (
              <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-[0_12px_32px_rgba(0,0,0,0.12)] border border-gray-100 py-2 z-50">
                {/* Header */}
                <div className="px-4 py-3 border-b border-gray-100">
                  <div className="text-sm font-semibold text-gray-900 truncate">{userEmail}</div>
                  <div className="mt-1 text-[12px] text-gray-500">
                    {isPremium ? (
                      <span>Premium</span>
                    ) : (
                      <>
                        <span>Free Plan </span>
                        <button onClick={() => router.push('/billing/upgrade')} className="text-[#3575E2] font-medium hover:underline">Upgrade</button>
                      </>
                    )}
                  </div>
                </div>

                {/* Menu items */}
                <button
                  onClick={() => { setShowDropdown(false); router.push('/profile'); }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-[14px] text-gray-800 hover:bg-gray-50"
                >
                  <UserIcon className="w-5 h-5 text-gray-500" />
                  <span className="font-medium text-[14px]">Account</span>
                </button>

                <button
                  onClick={() => { window.open(SUGGEST_FEATURE_URL, '_blank', 'noopener,noreferrer'); setShowDropdown(false); }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-[14px] text-gray-800 hover:bg-gray-50"
                >
                  <Lightbulb className="w-5 h-5 text-gray-500" />
                  <span className="font-medium">Suggest Feature</span>
                </button>

                <button
                  onClick={() => { setShowDropdown(false); router.push('/help'); }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-[14px] text-gray-800 hover:bg-gray-50"
                >
                  <FileText className="w-5 h-5 text-gray-500" />
                  <span className="font-medium">User Guides</span>
                </button>

                {/* Theme with submenu */}
                <div className="relative">
                  <button
                    onClick={() => setShowThemeSubmenu((s) => !s)}
                    className="w-full flex items-center justify-between px-4 py-2.5 text-[14px] text-gray-800 hover:bg-gray-50"
                  >
                    <span className="flex items-center gap-3">
                      <Palette className="w-5 h-5 text-gray-500" />
                      <span className="font-medium">Theme</span>
                    </span>
                    <ChevronRight className={`w-4 h-4 text-gray-500 transition-transform ${showThemeSubmenu ? 'rotate-90' : ''}`} />
                  </button>

                  {showThemeSubmenu && (
                    <div className="absolute top-0 left-full ml-2 w-48 bg-white rounded-xl shadow-[0_12px_32px_rgba(0,0,0,0.12)] border border-gray-100 py-2 z-50">
                      {(['light','dark','system'] as const).map((opt) => (
                        <button
                          key={opt}
                          onClick={() => { applyTheme(opt); setShowDropdown(false); setShowThemeSubmenu(false); }}
                          className={`w-full text-left px-4 py-2 text-[14px] hover:bg-gray-50 ${theme === opt ? 'font-semibold text-gray-900' : 'text-gray-800'}`}
                        >
                          {opt.charAt(0).toUpperCase() + opt.slice(1)}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="my-2 border-t border-gray-100" />

                <button
                  onClick={async () => { setShowDropdown(false); await handleLogout(); }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-[14px] text-gray-800 hover:bg-gray-50"
                >
                  <LogOut className="w-5 h-5 text-gray-500" />
                  <span className="font-medium">Log out</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
