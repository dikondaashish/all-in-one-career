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

import { User as UserIcon, Menu, LogOut, ChevronDown, ChevronRight, Palette, FileText, Lightbulb, WifiOff, Sun, Moon, Monitor } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import SmartSearch from './SmartSearch';
import NotificationBell from './notifications/NotificationBell';
import UpgradeModal from './modals/UpgradeModal';

import { useUserStore } from '@/stores/useUserStore';
import { useTheme } from '@/contexts/ThemeProvider';

const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://all-in-one-career-api.onrender.com'
  : 'http://localhost:4000';

interface TopbarProps {
  sidebarCollapsed: boolean;
  onToggleSidebar: () => void;
}

export default function Topbar({ sidebarCollapsed, onToggleSidebar }: TopbarProps) {
  const { user, signOutUser, isGuest, isFallbackAuth, retryBackendConnection } = useAuth();
  const { user: storeUser } = useUserStore();
  const { theme, setTheme } = useTheme();
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);
  const [dbLoading, setDbLoading] = useState(true);
  const [userDisplayName, setUserDisplayName] = useState('User');
  const [userEmail, setUserEmail] = useState('user@example.com');
  const [showDropdown, setShowDropdown] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showThemeSubmenu, setShowThemeSubmenu] = useState(false);
  const [plan, setPlan] = useState<'free' | 'premium'>('free');
  const isPremium = plan === 'premium';
  const SUGGEST_FEATURE_URL = 'https://forms.gle/';

  // Fix: ensure client-ready flag is set so header doesn't stay on skeleton
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Enhanced theme change function with backend sync
  const changeTheme = useCallback(async (newTheme: 'light' | 'dark' | 'system') => {
    console.log('Changing theme to:', newTheme);
    
    // Apply theme immediately using ThemeProvider
    setTheme(newTheme);
    
    // Close dropdowns
    setShowDropdown(false);
    setShowThemeSubmenu(false);

    // Persist to backend (fire-and-forget)
    try {
      if (!user) return;
      const token = await user.getIdToken();
      const response = await fetch(`${API_BASE_URL}/api/profile/update`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ theme: newTheme.toUpperCase() })
      });
      
      if (response.ok) {
        console.log('Theme saved to backend successfully');
      } else {
        console.warn('Failed to save theme to backend:', response.status);
      }
    } catch (error) {
      console.error('Error saving theme to backend:', error);
    }
  }, [setTheme, user]);

  // Fetch DB user once on client to avoid flashing Google avatar and get theme
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
            try { useUserStore.getState().updateProfileImage(data.profileImage); } catch {}
          }
          if (data?.theme && data.theme !== theme) {
            console.log('DB theme found, updating:', data.theme);
            const themeLower = data.theme.toLowerCase() as 'light' | 'dark' | 'system';
            setTheme(themeLower);
          }
        }
      } catch (error) {
        console.error('Error fetching profile theme:', error);
      }
      if (isMounted) setDbLoading(false);
    };
    run();
    return () => { isMounted = false; };
  }, [user, theme, setTheme]);

  // Source of truth: after DB fetched, use custom avatar if exists; otherwise fallback
  const resolvedAvatar = !dbLoading
    ? (storeUser?.profileImage && storeUser.profileImage !== ''
        ? storeUser.profileImage
        : (user?.photoURL || ''))
    : '';

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
      <div className="fixed top-0 left-0 right-0 h-16 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 z-50 transition-colors duration-200">
        <div className="flex items-center justify-between h-full px-6">
          <div className="w-32 h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
          <div className="w-48 h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
          <div className="w-32 h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Fallback Mode Banner */}
      {isFallbackAuth() && (
        <div className="fixed top-0 left-0 right-0 bg-yellow-500 dark:bg-yellow-600 text-yellow-900 dark:text-yellow-100 px-4 py-2 text-sm font-medium z-50 flex items-center justify-between transition-colors duration-200">
          <div className="flex items-center gap-2">
            <WifiOff className="w-4 h-4" />
            <span>Limited functionality mode - Backend connection unavailable</span>
          </div>
          <button
            onClick={async () => {
              const success = await retryBackendConnection();
              if (success) {
                // Refresh the page to show full functionality
                window.location.reload();
              }
            }}
            className="bg-yellow-600 dark:bg-yellow-700 hover:bg-yellow-700 dark:hover:bg-yellow-800 text-white px-3 py-1 rounded text-xs font-medium transition-colors"
          >
            Retry Connection
          </button>
        </div>
      )}
      
      <div className={`fixed top-0 left-0 right-0 h-16 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 z-40 transition-colors duration-200 ${isFallbackAuth() ? 'top-10' : ''}`}>
        <div className="flex items-center justify-between h-full px-6">
          {/* Left: Hamburger Menu + Logo */}
          <div className="flex items-center space-x-4">
            <button
              onClick={onToggleSidebar}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              aria-label="Toggle sidebar"
            >
              <Menu className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            </button>

            <div className="flex items-center">
              <div className="w-8 h-8 bg-gradient-to-br from-[#006B53] to-[#008F6F] dark:from-[#00d4aa] dark:to-[#00b894] rounded-lg flex items-center justify-center mr-3">
                <span className="text-white font-bold text-sm">C</span>
              </div>
              <span className="text-xl font-bold text-gray-900 dark:text-white">Climbly.ai</span>
            </div>
          </div>

          {/* Center: SmartSearch */}
          <div className="flex-1 max-w-2xl mx-8">
            <SmartSearch />
          </div>

          {/* Right: Notifications, Upgrade, User */}
          <div className="flex items-center space-x-4">
            {/* Upgrade Button */}
            <button 
              onClick={() => setShowUpgradeModal(true)}
              className="bg-[#006B53] dark:bg-[#00d4aa] text-white dark:text-black px-4 py-2 rounded-lg font-medium hover:bg-[#005A47] dark:hover:bg-[#00b894] transition-colors"
            >
              Upgrade to Premium
            </button>

            {/* Notifications */}
            <NotificationBell />

            {/* User Avatar + Chevron */}
            <div className="relative user-dropdown">
              <button
                onClick={() => setShowDropdown((s) => !s)}
                className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                aria-haspopup="menu"
                aria-expanded={showDropdown}
              >
                <div className="w-10 h-10 bg-gradient-to-br from-[#006B53] to-[#008F6F] dark:from-[#00d4aa] dark:to-[#00b894] rounded-full flex items-center justify-center overflow-hidden relative">
                  {dbLoading ? (
                    <div className="w-6 h-6 bg-white/30 rounded-full" />
                  ) : resolvedAvatar ? (
                    <img src={resolvedAvatar} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-white font-medium text-sm">{userDisplayName.charAt(0).toUpperCase()}</span>
                  )}
                </div>
                <ChevronDown className="w-4 h-4 text-gray-600 dark:text-gray-300" />
              </button>

              {/* Dropdown Menu */}
              {showDropdown && (
                <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-gray-900 rounded-xl shadow-[0_12px_32px_rgba(0,0,0,0.12)] dark:shadow-[0_12px_32px_rgba(0,0,0,0.4)] border border-gray-100 dark:border-gray-700 py-2 z-50 transition-colors duration-200">
                  {/* Header - Avatar + Name + Email */}
                  <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-700">
                    <div className="flex items-center gap-3" style={{ minHeight: 48, maxHeight: 60 }}>
                      {/* Dropdown header avatar */}
                      <div className="w-8 h-8 rounded-full overflow-hidden bg-gradient-to-br from-[#006B53] to-[#008F6F] dark:from-[#00d4aa] dark:to-[#00b894] flex items-center justify-center relative">
                        {dbLoading ? (
                          <div className="w-4 h-4 bg-white/30 rounded-full" />
                        ) : resolvedAvatar ? (
                          <img src={resolvedAvatar} alt="Profile" className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-white text-xs font-medium">{userDisplayName.charAt(0).toUpperCase()}</span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold text-[#111111] dark:text-white truncate">{userDisplayName}</div>
                        <div className="text-xs text-[#8F8F8F] dark:text-gray-400 truncate">{userEmail}</div>
                      </div>
                    </div>
                  </div>

                  {/* Menu items */}
                  <button
                    onClick={() => { setShowDropdown(false); router.push('/profile'); }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-[14px] text-gray-800 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    <UserIcon className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                    <span className="font-medium text-[14px]">Account</span>
                  </button>

                  <button
                    onClick={() => { window.open(SUGGEST_FEATURE_URL, '_blank', 'noopener,noreferrer'); setShowDropdown(false); }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-[14px] text-gray-800 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    <Lightbulb className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                    <span className="font-medium">Suggest Feature</span>
                  </button>

                  <button
                    onClick={() => { setShowDropdown(false); router.push('/help'); }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-[14px] text-gray-800 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    <FileText className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                    <span className="font-medium">User Guides</span>
                  </button>

                  {/* Theme with inline submenu */}
                  <div className="relative">
                    <button
                      onClick={() => setShowThemeSubmenu((s) => !s)}
                      className="w-full flex items-center justify-between px-4 py-2.5 text-[14px] text-gray-800 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    >
                      <span className="flex items-center gap-3">
                        <Palette className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                        <span className="font-medium">Theme</span>
                      </span>
                      <ChevronRight className={`w-4 h-4 text-gray-500 dark:text-gray-400 transition-transform ${showThemeSubmenu ? 'rotate-90' : ''}`} />
                    </button>

                    {showThemeSubmenu && (
                      <div className="w-full bg-gray-50 dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700 mt-1">
                        {([
                          { value: 'light', icon: Sun, label: 'Light' },
                          { value: 'dark', icon: Moon, label: 'Dark' },
                          { value: 'system', icon: Monitor, label: 'System' }
                        ] as const).map(({ value, icon: Icon, label }) => (
                          <button
                            key={value}
                            onClick={() => { changeTheme(value); }}
                            className={`w-full text-left px-8 py-2.5 text-[14px] hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center justify-between ${
                              theme === value 
                                ? 'font-semibold text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-700' 
                                : 'text-gray-700 dark:text-gray-300'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <Icon className="w-4 h-4" />
                              <span>{label}</span>
                            </div>
                            {theme === value && (
                              <div className="w-2 h-2 bg-[#006B53] dark:bg-[#00d4aa] rounded-full"></div>
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="my-2 border-t border-gray-100 dark:border-gray-700" />

                  <button
                    onClick={async () => { setShowDropdown(false); await handleLogout(); }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-[14px] text-gray-800 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    <LogOut className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                    <span className="font-medium">Log out</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Upgrade Modal */}
      <UpgradeModal 
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
      />
    </>
  );
}
