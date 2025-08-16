'use client';
import { useState, useEffect } from 'react';
import {
  Plus, Upload, TrendingUp, FileText, Briefcase, Mail, Users,
  Clock, Play, Target, BarChart3
} from 'lucide-react';

interface DashboardStats {
  atsScans: number;
  portfolios: number;
  emails: number;
  referrals: number;
}

interface ActivityItem {
  id: string;
  action: string;
  timeAgo: string;
  type: 'resume' | 'email' | 'portfolio' | 'application';
}

export default function DashboardPage() {
  const [stats] = useState<DashboardStats>({ atsScans: 24, portfolios: 10, emails: 12, referrals: 2 });
  const [activities] = useState<ActivityItem[]>([
    { id: '1', action: 'You tailored a resume', timeAgo: '2h ago', type: 'resume' },
    { id: '2', action: 'Generated AI email for Google application', timeAgo: '4h ago', type: 'email' },
    { id: '3', action: 'Created new portfolio', timeAgo: '6h ago', type: 'portfolio' },
  ]);
  const [isClient, setIsClient] = useState(false);
  const [greeting, setGreeting] = useState('Dashboard');

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (isClient) {
      const hours = new Date().getHours();
      if (hours < 12) {
        setGreeting('Good Morning');
      } else if (hours < 17) {
        setGreeting('Good Afternoon');
      } else {
        setGreeting('Good Evening');
      }
    }
  }, [isClient]);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'resume': return <FileText className="w-4 h-4" />;
      case 'email': return <Mail className="w-4 h-4" />;
      case 'portfolio': return <Briefcase className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'resume': return 'text-blue-400';
      case 'email': return 'text-purple-400';
      case 'portfolio': return 'text-pink-400';
      default: return 'text-gray-400';
    }
  };

  return (
    <div className="space-y-8">
      {/* Greeting Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">{greeting}, Ashish 👋</h1>
          <p className="text-gray-300">Plan, prioritize and accomplish your career tasks with ease.</p>
        </div>
        <div className="flex space-x-3">
          <button className="bg-gradient-to-r from-[#4F46E5] to-[#181A42] hover:from-[#4338CA] hover:to-[#15162F] text-white px-6 py-3 rounded-lg font-medium transition-all duration-200 flex items-center shadow-lg">
            <Plus className="w-5 h-5 mr-2" /> Add Application
          </button>
          <button className="border border-gray-600 text-gray-300 hover:text-white hover:bg-gray-800 px-6 py-3 rounded-lg font-medium transition-all duration-200 flex items-center">
            <Upload className="w-5 h-5 mr-2" /> Import
          </button>
        </div>
      </div>

      {/* Top KPI Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* ATS Scans Card */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 shadow-[0px_12px_30px_rgba(0,0,0,0.08)] p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-indigo-500/20 to-purple-600/20 rounded-full -translate-y-10 translate-x-10"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-300 uppercase tracking-wider">ATS Scans</h3>
              <FileText className="w-5 h-5 text-indigo-400" />
            </div>
            <div className="text-3xl font-bold text-white mb-2">{stats.atsScans}</div>
            <div className="flex items-center text-sm text-green-400">
              <TrendingUp className="w-4 h-4 mr-1" />
              5 ↑ Increased from last month
            </div>
          </div>
        </div>

        {/* Portfolios Card */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 shadow-[0px_12px_30px_rgba(0,0,0,0.08)] p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-purple-500/20 to-pink-600/20 rounded-full -translate-y-10 translate-x-10"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-300 uppercase tracking-wider">Portfolios</h3>
              <Briefcase className="w-5 h-5 text-purple-400" />
            </div>
            <div className="text-3xl font-bold text-white mb-2">{stats.portfolios}</div>
            <div className="flex items-center text-sm text-green-400">
              <TrendingUp className="w-4 h-4 mr-1" />
              6 ↑ Increased from last month
            </div>
          </div>
        </div>

        {/* AI Emails Card */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 shadow-[0px_12px_30px_rgba(0,0,0,0.08)] p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-pink-500/20 to-rose-600/20 rounded-full -translate-y-10 translate-x-10"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-300 uppercase tracking-wider">AI Emails</h3>
              <Mail className="w-5 h-5 text-pink-400" />
            </div>
            <div className="text-3xl font-bold text-white mb-2">{stats.emails}</div>
            <div className="flex items-center text-sm text-green-400">
              <TrendingUp className="w-4 h-4 mr-1" />
              2 ↑ Increased from last month
            </div>
          </div>
        </div>

        {/* Referrals Card */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 shadow-[0px_12px_30px_rgba(0,0,0,0.08)] p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-orange-500/20 to-yellow-600/20 rounded-full -translate-y-10 translate-x-10"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-300 uppercase tracking-wider">Referrals</h3>
              <Users className="w-5 h-5 text-orange-400" />
            </div>
            <div className="text-3xl font-bold text-white mb-2">{stats.referrals}</div>
            <div className="text-sm text-yellow-400">Pending approval</div>
          </div>
        </div>
      </div>

      {/* Middle Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Career Activity Analytics */}
        <div className="lg:col-span-2 bg-gradient-to-br from-[#232A59] to-[#101131] rounded-2xl shadow-[0px_12px_30px_rgba(0,0,0,0.08)] p-6 border border-white/10">
          <h3 className="text-xl font-bold text-white mb-6">Career Activity Analytics</h3>
          <div className="flex items-end justify-between h-32">
            {[
              { day: 'Mon', height: 65, color: 'from-blue-500 to-indigo-600' },
              { day: 'Tue', height: 45, color: 'from-indigo-500 to-purple-600' },
              { day: 'Wed', height: 55, color: 'from-purple-500 to-pink-600' },
              { day: 'Thu', height: 75, color: 'from-pink-500 to-rose-600' },
              { day: 'Fri', height: 35, color: 'from-rose-500 to-red-600' },
              { day: 'Sat', height: 60, color: 'from-red-500 to-orange-600' },
              { day: 'Sun', height: 50, color: 'from-orange-500 to-yellow-600' }
            ].map((item, index) => (
              <div key={index} className="flex flex-col items-center">
                <div className="text-xs text-gray-400 mb-2">{item.day}</div>
                <div className={`w-8 bg-gradient-to-t ${item.color} rounded-t-sm`} style={{ height: `${item.height}px` }}></div>
                {index === 3 && <div className="text-xs text-green-400 font-medium mt-1">74%</div>}
              </div>
            ))}
          </div>
        </div>

        {/* Reminders Box */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 shadow-[0px_12px_30px_rgba(0,0,0,0.08)] p-6">
          <h3 className="text-lg font-bold text-white mb-4">Upcoming Reminder</h3>
          <div className="space-y-4">
            <div>
              <p className="text-gray-300 text-sm mb-1">Follow up with recruiter from Google</p>
              <div className="flex items-center text-xs text-gray-400">
                <Clock className="w-4 h-4 mr-2" />
                04:00 pm — 04:30 pm
              </div>
            </div>
            <button className="w-full bg-gradient-to-r from-[#4F46E5] to-[#181A42] hover:from-[#4338CA] hover:to-[#15162F] text-white px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center justify-center">
              <Play className="w-4 h-4 mr-2" /> Start Now
            </button>
          </div>
        </div>
      </div>

      {/* Recent Activity Card */}
      <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 shadow-[0px_12px_30px_rgba(0,0,0,0.08)] p-6">
        <h3 className="text-xl font-bold text-white mb-6">Recent Activity</h3>
        <div className="space-y-4">
          {activities.map((activity) => (
            <div key={activity.id} className="flex items-center space-x-3 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors duration-200">
              <div className={`p-2 rounded-lg bg-white/10 ${getTypeColor(activity.type)}`}>
                {getTypeIcon(activity.type)}
              </div>
              <div className="flex-1">
                <p className="text-white text-sm">{activity.action}</p>
                <p className="text-gray-400 text-xs">{activity.timeAgo}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Goal Progress Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          {/* Empty space for future content */}
        </div>
        <div className="space-y-6">
          {/* Weekly Goal Card */}
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 shadow-[0px_12px_30px_rgba(0,0,0,0.08)] p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white">Weekly Goal</h3>
              <Target className="w-5 h-5 text-green-400" />
            </div>
            <div className="text-2xl font-bold text-white mb-2">5 / 7</div>
            <div className="w-full bg-gray-700 rounded-full h-2 mb-2">
              <div className="bg-gradient-to-r from-green-400 to-emerald-500 h-2 rounded-full" style={{ width: '71%' }}></div>
            </div>
            <p className="text-sm text-gray-400">Applications submitted</p>
          </div>

          {/* ATS Optimization Score Card */}
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 shadow-[0px_12px_30px_rgba(0,0,0,0.08)] p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white">ATS Optimization</h3>
              <BarChart3 className="w-5 h-5 text-indigo-400" />
            </div>
            <div className="text-2xl font-bold text-white mb-2">87%</div>
            <div className="w-full bg-gray-700 rounded-full h-2 mb-2">
              <div className="bg-gradient-to-r from-indigo-400 to-purple-500 h-2 rounded-full" style={{ width: '87%' }}></div>
            </div>
            <p className="text-sm text-gray-400">Resume optimization score</p>
          </div>
        </div>
      </div>
    </div>
  );
}
