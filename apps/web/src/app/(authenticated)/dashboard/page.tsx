'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNotificationToasts } from '@/hooks/useNotificationToasts';
import Button from '@/components/Button';
import { 
  TrendingUp, 
  Users, 
  Briefcase, 
  Target,
  Calendar,
  Award
} from 'lucide-react';

export const dynamic = 'force-dynamic';

export default function Dashboard() {
  const { user, isGuest } = useAuth();
  const [stats, setStats] = useState({
    applications: 0,
    interviews: 0,
    offers: 0,
    savedJobs: 0
  });

  // Enable notification toasts on dashboard
  useNotificationToasts();

  useEffect(() => {
    // Simulate fetching dashboard stats
    setStats({
      applications: 12,
      interviews: 3,
      offers: 1,
      savedJobs: 8
    });
  }, []);

  const dashboardCards = [
    {
      title: 'Total Applications',
      value: stats.applications,
      description: 'Jobs you\'ve applied to',
      icon: Briefcase,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100 dark:bg-blue-900/20'
    },
    {
      title: 'Interviews Scheduled',
      value: stats.interviews,
      description: 'Upcoming interviews',
      icon: Calendar,
      color: 'text-green-600',
      bgColor: 'bg-green-100 dark:bg-green-900/20'
    },
    {
      title: 'Job Offers',
      value: stats.offers,
      description: 'Offers received',
      icon: Award,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100 dark:bg-purple-900/20'
    },
    {
      title: 'Saved Jobs',
      value: stats.savedJobs,
      description: 'Jobs you\'re interested in',
      icon: Target,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100 dark:bg-orange-900/20'
    }
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Welcome back, {user?.displayName || 'User'}!
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Here&apos;s what&apos;s happening with your career journey
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {dashboardCards.map((card, index) => (
          <div key={index} className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-6 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
                {card.title}
              </h3>
              <div className={`p-2 rounded-full ${card.bgColor}`}>
                <card.icon className={`h-4 w-4 ${card.color}`} />
              </div>
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              {card.value}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {card.description}
            </p>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Recent Activity
            </h3>
          </div>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Your latest career updates and milestones
          </p>
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  Application submitted
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Software Engineer at Tech Corp
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  Interview scheduled
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Product Manager at Startup Inc
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Users className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Network Insights
            </h3>
          </div>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Connect with professionals in your field
          </p>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  New connections
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  This week
                </p>
              </div>
              <span className="text-2xl font-bold text-blue-600">5</span>
            </div>
            <Button className="w-full h-10">
              View Network
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
