'use client';

import { useRouter } from 'next/navigation';

export default function TermsPage() {
  const router = useRouter();

  const handleBackToLogin = () => {
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-[#E5E5E5] flex font-['Inter'] tracking-normal">
      {/* Left Panel - White Content (58% width) */}
      <div className="w-[58%] bg-white flex items-center justify-center px-16">
        <div className="w-full max-w-4xl max-h-[80vh] overflow-y-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4 font-serif">Terms & Conditions</h1>
            <p className="text-gray-600 text-lg">Last updated: August 15, 2024</p>
          </div>

          {/* Content */}
          <div className="prose prose-lg max-w-none">
            <div className="space-y-8">
              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4 font-serif">1. Acceptance of Terms</h2>
                <p className="text-gray-700 leading-relaxed">
                  By accessing and using Climbly, you accept and agree to be bound by the terms and 
                  provision of this agreement. If you do not agree to abide by the above, please do 
                  not use this service.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4 font-serif">2. Use License</h2>
                <p className="text-gray-700 leading-relaxed mb-4">
                  Permission is granted to temporarily use Climbly for personal, non-commercial 
                  transitory viewing only. This is the grant of a license, not a transfer of title, 
                  and under this license you may not:
                </p>
                <ul className="list-disc pl-6 text-gray-700 space-y-2">
                  <li>Modify or copy the materials</li>
                  <li>Use the materials for any commercial purpose</li>
                  <li>Attempt to reverse engineer any software contained on Climbly</li>
                  <li>Remove any copyright or other proprietary notations</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4 font-serif">3. User Responsibilities</h2>
                <p className="text-gray-700 leading-relaxed mb-4">
                  As a user of Climbly, you agree to:
                </p>
                <ul className="list-disc pl-6 text-gray-700 space-y-2">
                  <li>Provide accurate and complete information</li>
                  <li>Maintain the security of your account credentials</li>
                  <li>Use the service in compliance with applicable laws</li>
                  <li>Not engage in any harmful or malicious activities</li>
                  <li>Respect the intellectual property rights of others</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4 font-serif">4. Service Availability</h2>
                <p className="text-gray-700 leading-relaxed">
                  We strive to maintain high availability of our services, but we do not guarantee 
                  uninterrupted access. We may temporarily suspend services for maintenance, updates, 
                  or other operational reasons.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4 font-serif">5. Limitation of Liability</h2>
                <p className="text-gray-700 leading-relaxed">
                  Climbly shall not be held liable for any indirect, incidental, special, consequential, 
                  or punitive damages, including without limitation, loss of profits, data, use, goodwill, 
                  or other intangible losses.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4 font-serif">6. Termination</h2>
                <p className="text-gray-700 leading-relaxed">
                  We may terminate or suspend your account and access to our services immediately, 
                  without prior notice, for any reason whatsoever, including without limitation if 
                  you breach the Terms.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4 font-serif">7. Changes to Terms</h2>
                <p className="text-gray-700 leading-relaxed">
                  We reserve the right to modify or replace these Terms at any time. If a revision is 
                  material, we will provide at least 30 days notice prior to any new terms taking effect.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4 font-serif">8. Contact Information</h2>
                <p className="text-gray-700 leading-relaxed">
                  If you have any questions about these Terms & Conditions, please contact us at{' '}
                  <a href="mailto:legal@climbly.com" className="text-blue-600 hover:text-blue-500">
                    legal@climbly.com
                  </a>
                </p>
              </section>
            </div>
          </div>

          {/* Back to Login */}
          <div className="mt-12 text-center pt-8 border-t border-gray-200">
            <button
              onClick={handleBackToLogin}
              className="bg-blue-600 text-white py-3 px-8 rounded-xl font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200"
            >
              Back to Login
            </button>
          </div>
        </div>
      </div>

      {/* Right Panel - Dark Dashboard Preview (42% width) */}
      <div className="w-[42%] bg-gradient-to-b from-[#0E1129] to-[#1D233A] rounded-tr-xl rounded-br-xl relative overflow-hidden">
        {/* Static Content */}
        <div className="p-8 h-full flex flex-col">
          {/* Analytics Cards */}
          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 shadow-lg">
              <div className="text-2xl mb-3">📋</div>
              <div className="h-3 bg-white/20 rounded w-3/4 mb-2"></div>
              <div className="h-2 bg-white/10 rounded w-1/2"></div>
            </div>
            
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 shadow-lg">
              <div className="text-2xl mb-3">⚖️</div>
              <div className="h-3 bg-white/20 rounded w-2/3 mb-2"></div>
              <div className="h-2 bg-white/10 rounded w-3/4"></div>
            </div>
            
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 shadow-lg">
              <div className="text-2xl mb-3">🔒</div>
              <div className="h-3 bg-white/20 rounded w-4/5 mb-2"></div>
              <div className="h-2 bg-white/10 rounded w-1/2"></div>
            </div>
            
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 shadow-lg">
              <div className="text-2xl mb-3">📝</div>
              <div className="h-3 bg-white/20 rounded w-2/3 mb-2"></div>
              <div className="h-2 bg-white/10 rounded w-3/5"></div>
            </div>
          </div>

          {/* Chart Placeholder */}
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 mb-8 flex-1">
            <div className="h-4 bg-white/20 rounded w-1/3 mb-4"></div>
            <div className="space-y-3">
              <div className="h-2 bg-white/15 rounded w-full"></div>
              <div className="h-2 bg-white/15 rounded w-5/6"></div>
              <div className="h-2 bg-white/15 rounded w-4/5"></div>
              <div className="h-2 bg-white/15 rounded w-3/4"></div>
              <div className="h-2 bg-white/15 rounded w-2/3"></div>
            </div>
          </div>

          {/* Bottom Content */}
          <div className="text-center">
            <h2 className="text-2xl font-bold text-white mb-3">
              Clear & Fair Terms
            </h2>
            <p className="text-[#9CA3AF] text-sm mb-4 max-w-xs mx-auto">
              We believe in transparency and fair terms that protect both our users and our platform.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
