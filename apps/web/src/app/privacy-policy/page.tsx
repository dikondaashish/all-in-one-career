'use client';

import { useRouter } from 'next/navigation';

export default function PrivacyPolicyPage() {
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
            <h1 className="text-4xl font-bold text-gray-900 mb-4 font-serif">Privacy Policy</h1>
            <p className="text-gray-600 text-lg">Last updated: August 15, 2024</p>
          </div>

          {/* Content */}
          <div className="prose prose-lg max-w-none">
            <div className="space-y-8">
              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4 font-serif">1. Information We Collect</h2>
                <p className="text-gray-700 leading-relaxed mb-4">
                  We collect information you provide directly to us, such as when you create an account, 
                  use our services, or contact us for support. This may include:
                </p>
                <ul className="list-disc pl-6 text-gray-700 space-y-2">
                  <li>Name, email address, and other contact information</li>
                  <li>Resume and portfolio content you upload</li>
                  <li>Job application data and preferences</li>
                  <li>Communication history with our support team</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4 font-serif">2. How We Use Your Information</h2>
                <p className="text-gray-700 leading-relaxed mb-4">
                  We use the information we collect to:
                </p>
                <ul className="list-disc pl-6 text-gray-700 space-y-2">
                  <li>Provide, maintain, and improve our services</li>
                  <li>Process your job applications and portfolio requests</li>
                  <li>Send you important updates and notifications</li>
                  <li>Respond to your comments and questions</li>
                  <li>Protect against fraud and abuse</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4 font-serif">3. Information Sharing</h2>
                <p className="text-gray-700 leading-relaxed">
                  We do not sell, trade, or otherwise transfer your personal information to third parties 
                  without your consent, except as described in this policy. We may share your information 
                  with service providers who assist us in operating our platform.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4 font-serif">4. Data Security</h2>
                <p className="text-gray-700 leading-relaxed">
                  We implement appropriate security measures to protect your personal information against 
                  unauthorized access, alteration, disclosure, or destruction. However, no method of 
                  transmission over the internet is 100% secure.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4 font-serif">5. Your Rights</h2>
                <p className="text-gray-700 leading-relaxed mb-4">
                  You have the right to:
                </p>
                <ul className="list-disc pl-6 text-gray-700 space-y-2">
                  <li>Access and update your personal information</li>
                  <li>Request deletion of your data</li>
                  <li>Opt-out of marketing communications</li>
                  <li>Export your data in a portable format</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4 font-serif">6. Contact Us</h2>
                <p className="text-gray-700 leading-relaxed">
                  If you have any questions about this Privacy Policy, please contact us at{' '}
                  <a href="mailto:privacy@climbly.com" className="text-blue-600 hover:text-blue-500">
                    privacy@climbly.com
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
              <div className="text-2xl mb-3">🔒</div>
              <div className="h-3 bg-white/20 rounded w-3/4 mb-2"></div>
              <div className="h-2 bg-white/10 rounded w-1/2"></div>
            </div>
            
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 shadow-lg">
              <div className="text-2xl mb-3">🛡️</div>
              <div className="h-3 bg-white/20 rounded w-2/3 mb-2"></div>
              <div className="h-2 bg-white/10 rounded w-3/4"></div>
            </div>
            
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 shadow-lg">
              <div className="text-2xl mb-3">📊</div>
              <div className="h-3 bg-white/20 rounded w-4/5 mb-2"></div>
              <div className="h-2 bg-white/10 rounded w-1/2"></div>
            </div>
            
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 shadow-lg">
              <div className="text-2xl mb-3">⚡</div>
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
              Your Privacy Matters
            </h2>
            <p className="text-[#9CA3AF] text-sm mb-4 max-w-xs mx-auto">
              We&apos;re committed to protecting your personal information and ensuring transparency 
              in how we handle your data.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
