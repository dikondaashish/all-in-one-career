/**
 * Topbar Component with Push-Style Sidebar Integration
 * 
 * ✅ SUCCESSFULLY IMPLEMENTED: Topbar with sidebar toggle control
 * - Fixed positioning at the top of the screen
 * - Spans full width regardless of sidebar state
 * - Includes hamburger menu toggle for sidebar control
 * - Clean, consistent header design with sidebar integration
 * - Integrated SmartSearch component for global search functionality
 * - Real-time avatar updates with loading states
 */

'use client';

import { User as UserIcon, Menu, LogOut, ChevronDown, ChevronRight, Palette, FileText, Lightbulb } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import SmartSearch from './SmartSearch';
import NotificationBell from './notifications/NotificationBell';
import { useUserStore } from '@/stores/useUserStore';

const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://all-in-one-career-api.onrender.com'
  : 'http://localhost:4000';

interface TopbarProps {
  sidebarCollapsed: boolean;
  onToggleSidebar: () => void;
}

export default function Topbar({ sidebarCollapsed, onToggleSidebar }: TopbarProps) {
  const { user, signOutUser, isGuest } = useAuth();
  const { user: storeUser } = useUserStore();
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);
  const [dbLoading, setDbLoading] = useState(true);
  const [userDisplayName, setUserDisplayName] = useState('User');
  const [userEmail, setUserEmail] = useState('user@example.com');
  const [showDropdown, setShowDropdown] = useState(false);
  const [showThemeSubmenu, setShowThemeSubmenu] = useState(false);
  const [plan, setPlan] = useState<'free' | 'premium'>('free');
  const isPremium = plan === 'premium';
  const SUGGEST_FEATURE_URL = 'https://forms.gle/';

  // Fetch DB user once on client to avoid flashing Google avatar
  useEffect(() => {
    let isMounted = true;
    const run = async () => {
      if (!user) { setDbLoading(false); return; }
      try {
        const token = await user.getIdToken();
        const res = await fetch(`${API_BASE_URL}/api/profile`, { headers: { Authorization: `Bearer ${token}` } });
        if (res.ok) {
          const data = await res.json();
          if (data?.profileImage) {
            // write into store so it becomes single source of truth
            try { useUserStore.getState().updateProfileImage(data.profileImage); } catch {}
          }
        }
      } catch {}
      if (isMounted) setDbLoading(false);
    };
    run();
    return () => { isMounted = false; };
  }, [user]);

  // Source of truth: after DB fetched, use custom avatar if exists; otherwise fallback
  const resolvedAvatar = !dbLoading
    ? (storeUser?.profileImage && storeUser.profileImage !== ''
        ? storeUser.profileImage
        : (user?.photoURL || ''))
    : '';

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

  useEffect(() => { setIsClient(true); }, []);

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

  // Update user display info when user changes
  useEffect(() => {
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
  }, [user, isGuest]);

  const handleLogout = async () => {
    try {
      await signOutUser();
      router.push('/');
    } catch (error) {
      console.error('Logout error:', error);
      // Force redirect even if logout fails
      router.push('/');
    }
  };

  if (!isClient) {
    return (
      <div className="fixed top-0 left-0 right-0 h-16 bg-white border-b border-gray-200 z-50">
        <div className="flex items-center justify-between h-full px-6">
          <div className="w-32 h-8 bg-gray-200 rounded animate-pulse"></div>
          <div className="w-48 h-8 bg-gray-200 rounded animate-pulse"></div>
          <div className="w-32 h-8 bg-gray-200 rounded animate-pulse"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed top-0 left-0 right-0 h-16 bg-white border-b border-gray-200 z-50">
      <div className="flex items-center justify-between h-full px-6">
        {/* Left: Hamburger Menu + Logo */}
        <div className="flex items-center space-x-4">
          <button
            onClick={onToggleSidebar}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            aria-label="Toggle sidebar"
          >
            <Menu className="w-5 h-5 text-gray-600" />
          </button>

          <div className="flex items-center">
            <div className="w-8 h-8 bg-gradient-to-br from-[#006B53] to-[#008F6F] rounded-lg flex items-center justify-center mr-3">
              <span className="text-white font-bold text-sm">C</span>
            </div>
            <span className="text-xl font-bold text-gray-900">Climbly.ai</span>
          </div>
        </div>

        {/* Center: SmartSearch */}
        <div className="flex-1 max-w-2xl mx-8">
          <SmartSearch />
        </div>

        {/* Right: Notifications, Upgrade, User */}
        <div className="flex items-center space-x-4">
          {/* Upgrade Button */}
          <button className="bg-[#006B53] text-white px-4 py-2 rounded-lg font-medium hover:bg-[#005A47] transition-colors">
            UPGRADE
          </button>

          {/* Notifications */}
          <NotificationBell />

          {/* User Avatar + Chevron */}
          <div className="relative user-dropdown">
            <button
              onClick={() => setShowDropdown((s) => !s)}
              className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100 transition-colors"
              aria-haspopup="menu"
              aria-expanded={showDropdown}
            >
              <div className="w-10 h-10 bg-gradient-to-br from-[#006B53] to-[#008F6F] rounded-full flex items-center justify-center overflow-hidden relative">
                {dbLoading ? (
                  <div className="w-6 h-6 bg-white/30 rounded-full" />
                ) : resolvedAvatar ? (
                  <img src={resolvedAvatar} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-white font-medium text-sm">{userDisplayName.charAt(0).toUpperCase()}</span>
                )}
              </div>
              <ChevronDown className="w-4 h-4 text-gray-600" />
            </button>

            {/* Dropdown Menu */}
            {showDropdown && (
              <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-[0_12px_32px_rgba(0,0,0,0.12)] border border-gray-100 py-2 z-50">
                {/* Header - Avatar + Name + Email */}
                <div className="px-4 py-2 border-b border-gray-100">
                  <div className="flex items-center gap-3" style={{ minHeight: 48, maxHeight: 60 }}>
                    {/* Dropdown header avatar */}
                    <div className="w-8 h-8 rounded-full overflow-hidden bg-gradient-to-br from-[#006B53] to-[#008F6F] flex items-center justify-center relative">
                      {dbLoading ? (
                        <div className="w-4 h-4 bg-white/30 rounded-full" />
                      ) : resolvedAvatar ? (
                        <img src={resolvedAvatar} alt="Profile" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-white text-xs font-medium">{userDisplayName.charAt(0).toUpperCase()}</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-[#111111] truncate">{userDisplayName}</div>
                      <div className="text-xs text-[#8F8F8F] truncate">{userEmail}</div>
                    </div>
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
