'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import { 
  Plus, 
  Upload,
  TrendingUp,
  FileText, 
  Briefcase, 
  Mail, 
  Users,
  Clock,
  Play,
  Square,
  Calendar,
  BarChart3
} from 'lucide-react';

// Force dynamic rendering to prevent static generation issues
export const dynamic = 'force-dynamic';

interface DashboardStats {
  atsScans: number;
  portfolios: number;
  emails: number;
  referrals: number;
}

interface ActivityItem {
  id: string;
  user: string;
  task: string;
  status: 'completed' | 'in-progress' | 'pending';
  avatar: string;
}

interface ProjectItem {
  id: string;
  name: string;
  dueDate: string;
  icon: React.ComponentType<{ className?: string }>;
}

export default function DashboardPage() {
  // STEP 6: Wrap dashboard with ProtectedRoute to prevent flashing
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  );
}

function DashboardContent() {
  const [stats] = useState<DashboardStats>({
    atsScans: 24,
    portfolios: 10,
    emails: 12,
    referrals: 2
  });
  const [activities] = useState<ActivityItem[]>([
    { id: '1', user: 'Alexandra Deff', task: 'Working on Github Project Repository', status: 'completed', avatar: 'AD' },
    { id: '2', user: 'Edwin Adenike', task: 'Working on Integrate User Authentication System', status: 'in-progress', avatar: 'EA' },
    { id: '3', user: 'Isaac Oluwatemilorun', task: 'Working on Develop Search and Filter Functionality', status: 'pending', avatar: 'IO' },
    { id: '4', user: 'David Oshodi', task: 'Working on Responsive Layout for Homepage', status: 'in-progress', avatar: 'DO' },
  ]);
  const [projects] = useState<ProjectItem[]>([
    { id: '1', name: 'Develop API Endpoints', dueDate: 'Nov 26, 2024', icon: FileText },
    { id: '2', name: 'Onboarding Flow', dueDate: 'Nov 28, 2024', icon: Briefcase },
    { id: '3', name: 'Build Dashboard', dueDate: 'Nov 30, 2024', icon: Mail },
    { id: '4', name: 'Optimize Page Load', dueDate: 'Dec 5, 2024', icon: Users },
    { id: '5', name: 'Cross-Browser Testing', dueDate: 'Dec 6, 2024', icon: Clock },
  ]);
  const [isClient, setIsClient] = useState(false);
  const [greeting, setGreeting] = useState('Dashboard');

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (isClient) {
      const hour = new Date().getHours();
      if (hour < 12) {
        setGreeting('Good Morning');
      } else if (hour < 17) {
        setGreeting('Good Afternoon');
      } else {
        setGreeting('Good Evening');
      }
    }
  }, [isClient]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'in-progress':
        return 'bg-yellow-100 text-yellow-800';
      case 'pending':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-8">
      {/* Greeting Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{greeting}</h1>
          <p className="text-gray-600">Plan, prioritize and accomplish your career tasks with ease.</p>
        </div>
        <div className="flex space-x-3">
          <button className="bg-[#006B53] hover:bg-[#005A47] text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200 flex items-center">
            <Plus className="w-5 h-5 mr-2" />
            Add Application
          </button>
          <button className="border border-gray-300 text-gray-700 px-6 py-3 rounded-lg font-medium hover:bg-gray-50 transition-colors duration-200 flex items-center">
            <Upload className="w-5 h-5 mr-2" />
            Import
          </button>
        </div>
      </div>

      {/* Top KPI Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* ATS Scans Card */}
        <div className="bg-white rounded-2xl shadow-[0px_12px_30px_rgba(0,0,0,0.05)] p-6 h-35">
          <div className="flex items-center justify-between mb-4">
            <div className="text-3xl font-bold text-[#006B53]">{stats.atsScans}</div>
            <TrendingUp className="w-6 h-6 text-green-500" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">ATS Scans</h3>
          <div className="w-12 h-1 bg-gradient-to-r from-[#006B53] to-[#008F6F] rounded-full mb-3"></div>
          <p className="text-sm text-gray-600">5 Increased from last month</p>
        </div>

        {/* Portfolios Card */}
        <div className="bg-white rounded-2xl shadow-[0px_12px_30px_rgba(0,0,0,0.05)] p-6 h-35">
          <div className="flex items-center justify-between mb-4">
            <div className="text-3xl font-bold text-gray-900">{stats.portfolios}</div>
            <TrendingUp className="w-6 h-6 text-green-500" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Portfolios</h3>
          <div className="w-12 h-1 bg-gradient-to-r from-[#006B53] to-[#008F6F] rounded-full mb-3"></div>
          <p className="text-sm text-gray-600">6 Increased from last month</p>
        </div>

        {/* AI Emails Card */}
        <div className="bg-white rounded-2xl shadow-[0px_12px_30px_rgba(0,0,0,0.05)] p-6 h-35">
          <div className="flex items-center justify-between mb-4">
            <div className="text-3xl font-bold text-gray-900">{stats.emails}</div>
            <TrendingUp className="w-6 h-6 text-green-500" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">AI Emails</h3>
          <div className="w-12 h-1 bg-gradient-to-r from-[#006B53] to-[#008F6F] rounded-full mb-3"></div>
          <p className="text-sm text-gray-600">2 Increased from last month</p>
        </div>

        {/* Referrals Card */}
        <div className="bg-white rounded-2xl shadow-[0px_12px_30px_rgba(0,0,0,0.05)] p-6 h-35">
          <div className="flex items-center justify-between mb-4">
            <div className="text-3xl font-bold text-gray-900">{stats.referrals}</div>
            <div className="text-sm text-gray-500">On Discuss</div>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Referrals</h3>
          <div className="w-12 h-1 bg-gradient-to-r from-[#006B53] to-[#008F6F] rounded-full mb-3"></div>
          <p className="text-sm text-gray-600">Pending approval</p>
        </div>
      </div>

      {/* Middle Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Project Analytics */}
        <div className="bg-white rounded-2xl shadow-[0px_12px_30px_rgba(0,0,0,0.05)] p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-6">Project Analytics</h3>
          <div className="flex items-end justify-between h-32">
            {[
              { day: 'S', height: 65 },
              { day: 'M', height: 45 },
              { day: 'T', height: 55 },
              { day: 'W', height: 75 },
              { day: 'T', height: 35 },
              { day: 'F', height: 60 },
              { day: 'S', height: 50 }
            ].map((item, index) => (
              <div key={index} className="flex flex-col items-center">
                <div className="text-xs text-gray-500 mb-2">{item.day}</div>
                <div className="w-8 bg-[#006B53] rounded-t-sm" style={{ height: `${item.height}px` }}></div>
                {index === 3 && <div className="text-xs text-[#006B53] font-medium mt-1">74%</div>}
              </div>
            ))}
          </div>
        </div>

        {/* Reminders */}
        <div className="bg-white rounded-2xl shadow-[0px_12px_30px_rgba(0,0,0,0.05)] p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-6">Reminders</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium text-gray-900">Meeting with Arc Company</p>
                <p className="text-sm text-gray-500">02.00 pm - 04.00 pm</p>
              </div>
              <button className="bg-[#006B53] hover:bg-[#005A47] text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center">
                <Play className="w-4 h-4 mr-2" />
                Start Meeting
              </button>
                            </div>
          </div>
        </div>
      </div>

      {/* Bottom Section Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Team Collaboration */}
        <div className="bg-white rounded-2xl shadow-[0px_12px_30px_rgba(0,0,0,0.05)] p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-900">Recent Activity</h3>
            <button className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-50 transition-colors duration-200">
              + Add Member
            </button>
          </div>
          <div className="space-y-4">
            {activities.map((activity) => (
              <div key={activity.id} className="flex items-start space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-[#006B53] to-[#008F6F] rounded-full flex items-center justify-center text-white font-medium text-sm">
                  {activity.avatar}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{activity.user}</p>
                  <p className="text-sm text-gray-600">{activity.task}</p>
                  <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium mt-1 ${getStatusColor(activity.status)}`}>
                    {activity.status.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Project Progress */}
        <div className="bg-white rounded-2xl shadow-[0px_12px_30px_rgba(0,0,0,0.05)] p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-6">Applications Progress</h3>
          <div className="flex items-center justify-center mb-6">
            <div className="relative w-32 h-32">
              {/* Donut Chart */}
              <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 32 32">
                <circle
                  cx="16"
                  cy="16"
                  r="14"
                  fill="none"
                  stroke="#e5e7eb"
                  strokeWidth="3"
                />
                <circle
                  cx="16"
                  cy="16"
                  r="14"
                  fill="none"
                  stroke="#006B53"
                  strokeWidth="3"
                  strokeDasharray={`${2 * Math.PI * 14 * 0.41} ${2 * Math.PI * 14}`}
                  strokeDashoffset="0"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-2xl font-bold text-[#006B53]">41%</span>
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-[#006B53] rounded-full mr-2"></div>
                <span className="text-sm text-gray-600">Completed</span>
              </div>
              <span className="text-sm font-medium text-gray-900">41%</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></div>
                <span className="text-sm text-gray-600">In Progress</span>
              </div>
              <span className="text-sm font-medium text-gray-900">35%</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-orange-500 rounded-full mr-2"></div>
                <span className="text-sm text-gray-600">Pending</span>
              </div>
              <span className="text-sm font-medium text-gray-900">24%</span>
            </div>
          </div>
        </div>

        {/* Time Tracker */}
        <div className="bg-white rounded-2xl shadow-[0px_12px_30px_rgba(0,0,0,0.05)] p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-6">Time Tracker</h3>
          <div className="text-center">
            <div className="text-4xl font-bold text-[#006B53] mb-6">01:24:08</div>
            <div className="flex justify-center space-x-4">
              <button className="w-12 h-12 bg-[#006B53] hover:bg-[#005A47] text-white rounded-full flex items-center justify-center transition-colors duration-200">
                <Play className="w-5 h-5" />
              </button>
              <button className="w-12 h-12 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center transition-colors duration-200">
                <Square className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Project List */}
      <div className="bg-white rounded-2xl shadow-[0px_12px_30px_rgba(0,0,0,0.05)] p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-900">Projects</h3>
          <button className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-50 transition-colors duration-200">
            + New
          </button>
        </div>
        <div className="space-y-4">
          {projects.map((project) => (
            <div key={project.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <project.icon className="w-5 h-5 text-[#006B53]" />
                <span className="font-medium text-gray-900">{project.name}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-500">Due: {project.dueDate}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
