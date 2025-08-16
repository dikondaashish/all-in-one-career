'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  FileText, 
  Briefcase, 
  Mail, 
  Users, 
  BarChart3, 
  User 
} from 'lucide-react';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/ats', label: 'ATS', icon: FileText },
  { href: '/portfolio', label: 'Portfolio', icon: Briefcase },
  { href: '/emails', label: 'Emails', icon: Mail },
  { href: '/referrals', label: 'Referrals', icon: Users },
  { href: '/tracker', label: 'Tracker', icon: BarChart3 },
  { href: '/profile', label: 'Profile', icon: User },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="fixed left-0 top-16 w-60 h-[calc(100vh-4rem)] bg-white border-r border-gray-200 z-40">
      <nav className="p-4 space-y-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <Icon 
                size={20} 
                className={isActive ? 'text-white' : 'text-gray-500'} 
              />
              <span className="font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
