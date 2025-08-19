'use client';

import { HelpCircle, Search, FileText, Briefcase, Mail, Users, ClipboardList, BarChart3 } from 'lucide-react';

// Force dynamic rendering to prevent static generation issues
export const dynamic = 'force-dynamic';

export default function HelpPage() {
  return (
    <div className="min-h-screen bg-[#F0F2F5] pt-18">
      <div className="p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Help & Support</h1>
          <p className="text-gray-600">Get help with using Climbly.ai features</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* SmartSearch Help */}
          <div className="bg-white rounded-2xl p-6 shadow-[0px_12px_30px_rgba(0,0,0,0.05)]">
            <div className="flex items-center mb-4">
              <Search className="w-6 h-6 text-[#006B53] mr-3" />
              <h2 className="text-xl font-semibold text-gray-900">SmartSearch</h2>
            </div>
            <div className="space-y-3 text-sm text-gray-600">
              <p>• <strong>Basic Search:</strong> Type any keyword to search across applications, portfolios, and referrals</p>
              <p>• <strong>AI Questions:</strong> End your query with &quot;?&quot; for AI-powered career insights</p>
              <p>• <strong>Filters:</strong> Use model type and date range filters to narrow results</p>
              <p>• <strong>Results:</strong> Click on any result to navigate to the detailed view</p>
            </div>
          </div>

          {/* Navigation Help */}
          <div className="bg-white rounded-2xl p-6 shadow-[0px_12px_30px_rgba(0,0,0,0.05)]">
            <div className="flex items-center mb-4">
              <FileText className="w-6 h-6 text-[#006B53] mr-3" />
              <h2 className="text-xl font-semibold text-gray-900">Navigation</h2>
            </div>
            <div className="space-y-3 text-sm text-gray-600">
              <p>• <strong>Dashboard:</strong> Overview of your career progress and metrics</p>
              <p>• <strong>ATS:</strong> Track your ATS scan results and scores</p>
              <p>• <strong>Portfolio:</strong> Manage your portfolio sites and themes</p>
              <p>• <strong>Emails:</strong> Track your outreach and follow-up emails</p>
              <p>• <strong>Referrals:</strong> Manage referral requests and connections</p>
              <p>• <strong>Tracker:</strong> Monitor application progress and timelines</p>
              <p>• <strong>Insights:</strong> View search analytics and patterns</p>
            </div>
          </div>

          {/* Tips & Tricks */}
          <div className="bg-white rounded-2xl p-6 shadow-[0px_12px_30px_rgba(0,0,0,0.05)]">
            <div className="flex items-center mb-4">
              <BarChart3 className="w-6 h-6 text-[#006B53] mr-3" />
              <h2 className="text-xl font-semibold text-gray-900">Tips & Tricks</h2>
            </div>
            <div className="space-y-3 text-sm text-gray-600">
              <p>• <strong>Collapsible Sidebar:</strong> Use the menu button to save screen space</p>
              <p>• <strong>Search History:</strong> Check Insights page to see your search patterns</p>
              <p>• <strong>Quick Actions:</strong> Use the dashboard buttons for common tasks</p>
              <p>• <strong>Responsive Design:</strong> Works seamlessly on mobile and desktop</p>
            </div>
          </div>

          {/* Support */}
          <div className="bg-white rounded-2xl p-6 shadow-[0px_12px_30px_rgba(0,0,0,0.05)]">
            <div className="flex items-center mb-4">
              <HelpCircle className="w-6 h-6 text-[#006B53] mr-3" />
              <h2 className="text-xl font-semibold text-gray-900">Need More Help?</h2>
            </div>
            <div className="space-y-3 text-sm text-gray-600">
              <p>• <strong>Documentation:</strong> Check our comprehensive guides</p>
              <p>• <strong>Community:</strong> Join our user community forum</p>
              <p>• <strong>Contact:</strong> Reach out to our support team</p>
              <p>• <strong>Updates:</strong> Stay informed about new features</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
