'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { 
  DocumentTextIcon, 
  UserGroupIcon, 
  EnvelopeIcon, 
  BriefcaseIcon, 
  ClipboardDocumentListIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';

export default function DashboardPage() {
  const { user, signOutUser, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const dashboardCards = [
    {
      title: 'ATS Scanner',
      description: 'Scan and optimize your resume for job applications',
      icon: DocumentTextIcon,
      href: '/ats',
      color: 'bg-blue-500 hover:bg-blue-600'
    },
    {
      title: 'Portfolio Generator',
      description: 'Create a professional portfolio to showcase your work',
      icon: BriefcaseIcon,
      href: '/portfolio',
      color: 'bg-green-500 hover:bg-green-600'
    },
    {
      title: 'AI Emails',
      description: 'Generate personalized application emails with AI',
      icon: EnvelopeIcon,
      href: '/emails',
      color: 'bg-purple-500 hover:bg-purple-600'
    },
    {
      title: 'Referral Marketplace',
      description: 'Connect with professionals for referrals',
      icon: UserGroupIcon,
      href: '/referrals',
      color: 'bg-orange-500 hover:bg-orange-600'
    },
    {
      title: 'Job Tracker',
      description: 'Track your job applications and progress',
      icon: ClipboardDocumentListIcon,
      href: '/tracker',
      color: 'bg-red-500 hover:bg-red-600'
    },
    {
      title: 'AI Assistant',
      description: 'Get AI-powered career advice and insights',
      icon: SparklesIcon,
      href: '/assistant',
      color: 'bg-indigo-500 hover:bg-indigo-600'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <h1 className="text-3xl font-bold text-gray-900">
              All-in-One Career Platform
            </h1>
                                        <div className="flex items-center space-x-4">
                              <span className="text-gray-700">
                                Welcome, {user.displayName || user.email}
                              </span>
                            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {dashboardCards.map((card) => (
              <div
                key={card.title}
                onClick={() => router.push(card.href)}
                className="bg-white overflow-hidden shadow-lg rounded-lg cursor-pointer transform transition-all duration-200 hover:scale-105 hover:shadow-xl"
              >
                <div className={`p-6 ${card.color} text-white`}>
                  <card.icon className="h-12 w-12" />
                </div>
                <div className="p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    {card.title}
                  </h3>
                  <p className="text-gray-600 text-sm">
                    {card.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
