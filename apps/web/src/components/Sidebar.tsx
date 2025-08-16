'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  FileText, 
  Briefcase, 
  Mail, 
  Users, 
  ClipboardList,
  User,
  Settings,
  HelpCircle,
  LogOut,
  Download,
  Smartphone
} from 'lucide-react';

export default function Sidebar() {
  const pathname = usePathname();

  const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/ats', label: 'ATS', icon: FileText },
    { href: '/portfolio', label: 'Portfolio', icon: Briefcase },
    { href: '/emails', label: 'Emails', icon: Mail },
    { href: '/referrals', label: 'Referrals', icon: Users },
    { href: '/tracker', label: 'Tracker', icon: ClipboardList },
    { href: '/profile', label: 'Profile', icon: User },
  ];

  const generalItems = [
    { href: '/settings', label: 'Settings', icon: Settings },
    { href: '/help', label: 'Help', icon: HelpCircle },
    { href: '/logout', label: 'Logout', icon: LogOut },
  ];

  return (
    <div className="fixed left-0 top-0 h-full w-60 bg-white shadow-inner z-30">
      {/* Logo Section */}
      <div className="h-18 flex items-center justify-center border-b border-gray-100">
        <div className="w-10 h-10 bg-gradient-to-br from-[#006B53] to-[#008F6F] rounded-lg flex items-center justify-center">
          <span className="text-white font-bold text-xl">C</span>
        </div>
        <span className="ml-3 text-xl font-bold text-gray-900">Climbly.ai</span>
      </div>

      {/* Navigation */}
      <nav className="mt-8 px-4">
        {/* Menu Section */}
        <div className="mb-8">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4 px-4">
            Menu
          </h3>
          <ul className="space-y-2">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={`flex items-center px-4 py-3 rounded-xl transition-all duration-200 group ${
                      isActive
                        ? 'bg-[#006B53]/10 text-[#006B53] border-l-4 border-l-[#006B53]'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <item.icon className={`w-5 h-5 mr-3 ${
                      isActive ? 'text-[#006B53]' : 'text-gray-400 group-hover:text-gray-600'
                    }`} />
                    <span className="font-medium">{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>

        {/* General Section */}
        <div className="mb-8">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4 px-4">
            General
          </h3>
          <ul className="space-y-2">
            {generalItems.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="flex items-center px-4 py-3 rounded-xl transition-all duration-200 group text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                >
                  <item.icon className="w-5 h-5 mr-3 text-gray-400 group-hover:text-gray-600" />
                  <span className="font-medium">{item.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Promotional Download Card */}
        <div className="px-4">
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-6 text-white relative overflow-hidden">
            {/* Abstract Pattern Background */}
            <div className="absolute top-0 right-0 w-24 h-24 bg-[#006B53]/20 rounded-full -translate-y-8 translate-x-8"></div>
            <div className="absolute bottom-0 left-0 w-16 h-16 bg-[#006B53]/20 rounded-full translate-y-8 -translate-x-8"></div>
            
            <div className="relative z-10">
              <div className="flex items-center mb-3">
                <Smartphone className="w-6 h-6 text-[#006B53] mr-2" />
                <h4 className="font-semibold text-lg">Download our Mobile App</h4>
              </div>
              <p className="text-gray-300 text-sm mb-4">Get easy in another way</p>
              <button className="bg-[#006B53] hover:bg-[#005A47] text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center">
                <Download className="w-4 h-4 mr-2" />
                Download
              </button>
            </div>
          </div>
        </div>
      </nav>
    </div>
  );
}
