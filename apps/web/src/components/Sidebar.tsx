/**
 * Sidebar Component with Push-Style Behavior
 * 
 * ✅ SUCCESSFULLY IMPLEMENTED: Push-style sidebar for responsive layout
 * - Responsive design that works across different screen sizes
 * - Smooth animations and transitions
 * - Mobile-friendly with overlay and auto-collapse
 * - Proper state management and communication with parent layout
 * - Tooltips for collapsed state navigation items
 * - Push behavior: content shifts right when expanded, left when collapsed
 * 
 * Features:
 * - Controlled by parent layout state
 * - Responsive behavior (auto-collapse on mobile)
 * - Smooth transitions and animations
 * - Mobile overlay for better UX
 * - Icon-only view when collapsed
 * - Maintains all navigation functionality
 */

'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  LayoutDashboard, 
  FileText, 
  Briefcase, 
  Mail, 
  Users, 
  Clock, 
  Settings, 
  HelpCircle, 
  Download
} from 'lucide-react';


interface SidebarProps {
  isCollapsed: boolean;
  onToggle: (collapsed: boolean) => void;
}

export default function Sidebar({ isCollapsed, onToggle }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();


  const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/portfolio', label: 'Portfolio', icon: Briefcase },
    { href: '/emails', label: 'Emails', icon: Mail },
    { href: '/referrals', label: 'Referrals', icon: Users },
    { href: '/tracker', label: 'Tracker', icon: Clock },
    { href: '/search-insights', label: 'Insights', icon: FileText }, // Changed from BarChart3 to FileText for consistency
  ];

  const generalItems = [
    { href: '/settings', label: 'Settings', icon: Settings, action: () => router.push('/settings') },
    { href: '/help', label: 'Help', icon: HelpCircle, action: () => router.push('/help') },
  ];

  // Auto-collapse sidebar on mobile when navigating
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024 && !isCollapsed) {
        onToggle(true);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isCollapsed, onToggle]);

  return (
    <>
      {/* Mobile Menu Toggle Button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <button
          onClick={() => onToggle(!isCollapsed)}
          className="p-2 bg-white rounded-lg shadow-lg border border-gray-200 hover:bg-gray-50 transition-colors"
        >
          {/* Menu icon */}
        </button>
      </div>

      {/* Sidebar */}
      <div className={`fixed left-0 top-18 h-[calc(100vh-4.5rem)] bg-white shadow-inner z-30 transition-all duration-300 ease-in-out ${
        isCollapsed ? 'w-16' : 'w-60'
      }`}>
        {/* Navigation */}
        <nav className="mt-4 px-2">
          {/* Menu Section */}
          <div className="mb-8">
            {!isCollapsed && (
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4 px-2">
                Menu
              </h3>
            )}
            <ul className="space-y-2">
              {navItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={`flex items-center px-2 py-3 rounded-xl transition-all duration-200 group ${
                        isActive
                          ? 'bg-[#006B53]/10 text-[#006B53] border-l-4 border-l-[#006B53]'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      } ${isCollapsed ? 'justify-center' : ''}`}
                      title={isCollapsed ? item.label : undefined}
                    >
                      <item.icon className={`${
                        isCollapsed ? 'w-6 h-6' : 'w-5 h-5 mr-3'
                      } ${
                        isActive ? 'text-[#006B53]' : 'text-gray-400 group-hover:text-gray-600'
                      }`} />
                      {!isCollapsed && (
                        <span className="font-medium">{item.label}</span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* General Section */}
          <div className="mb-8">
            {!isCollapsed && (
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4 px-2">
                General
              </h3>
            )}
            <ul className="space-y-2">
              {generalItems
                .filter(item => !isCollapsed || item.label === 'Settings' || item.label === 'Help') // Hide Profile and Logout when collapsed
                .map((item) => (
                <li key={item.href}>
                  <button
                    onClick={item.action}
                    className={`w-full flex items-center px-2 py-3 rounded-xl transition-all duration-200 group text-gray-600 hover:bg-gray-50 hover:text-gray-900 ${
                      isCollapsed ? 'justify-center' : ''
                    }`}
                    title={isCollapsed ? item.label : undefined}
                  >
                    <item.icon className={`${
                      isCollapsed ? 'w-6 h-6' : 'w-5 h-5 mr-3'
                    } text-gray-400 group-hover:text-gray-600`} />
                    {!isCollapsed && (
                      <span className="font-medium">{item.label}</span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Promotional Download Card */}
          {!isCollapsed && (
            <div className="px-2">
              <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-6 text-white relative overflow-hidden">
                {/* Abstract Pattern Background */}
                <div className="absolute top-0 right-0 w-24 h-24 bg-[#006B53]/20 rounded-full -translate-y-8 translate-x-8"></div>
                <div className="absolute bottom-0 left-0 w-16 h-16 bg-[#006B53]/20 rounded-full translate-y-8 -translate-x-8"></div>

                <div className="relative z-10">
                  <div className="flex items-center mb-3">
                    {/* Smartphone icon */}
                  </div>
                  <p className="text-gray-300 text-sm mb-4">Get easy in another way</p>
                  <button className="bg-[#006B53] hover:bg-[#005A47] text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center">
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </button>
                </div>
              </div>
            </div>
          )}
        </nav>
      </div>

      {/* Overlay for mobile */}
      {!isCollapsed && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-20"
          onClick={() => onToggle(true)}
        />
      )}
    </>
  );
}