'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const { sendPasswordReset } = useAuth();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);

  // Slider data (same as landing page)
  const slides = [
    {
      title: "Transform Data into Cool Insights",
      subtitle: "Unlock the power of your data with our advanced analytics platform. Get real-time insights and make data-driven decisions.",
      cards: [
        { icon: "📊", label: "Analytics Dashboard", value: "Real-time metrics" },
        { icon: "📈", label: "Performance Tracking", value: "Growth insights" },
        { icon: "🎯", label: "Goal Setting", value: "Smart objectives" },
        { icon: "🚀", label: "Action Items", value: "Next steps" }
      ]
    },
    {
      title: "Career Growth Made Simple",
      subtitle: "Your all-in-one platform for job searching, skill development, and professional networking. Take control of your career journey.",
      cards: [
        { icon: "💼", label: "Job Tracker", value: "Application status" },
        { icon: "📝", label: "ATS Optimizer", value: "Resume scanning" },
        { icon: "🎨", label: "Portfolio Builder", value: "Showcase work" },
        { icon: "📧", label: "AI Email Writer", value: "Professional outreach" }
      ]
    },
    {
      title: "AI-Powered Career Tools",
      subtitle: "Leverage artificial intelligence to optimize your resume, craft compelling emails, and discover the best opportunities in your field.",
      cards: [
        { icon: "🤖", label: "Smart Scanning", value: "AI analysis" },
        { icon: "✍️", label: "Content Generation", value: "AI writing" },
        { icon: "🔍", label: "Opportunity Finder", value: "AI matching" },
        { icon: "📊", label: "Market Insights", value: "AI trends" }
      ]
    }
  ];

  // Auto-rotate slides
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [slides.length]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess(false);

    try {
      await sendPasswordReset(email);
      setSuccess(true);
    } catch (error: any) {
      setError(error.message || 'Failed to send reset email');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToLogin = () => {
    router.push('/');
  };

  const handleResend = () => {
    setSuccess(false);
    setEmail('');
  };

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };

  return (
    <div className="min-h-screen bg-[#E5E5E5] flex font-['Inter'] tracking-normal">
      {/* Left Panel - White Form (58% width) */}
      <div className="w-[58%] bg-white flex items-center justify-center px-16">
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Reset your Password</h1>
            <p className="text-gray-600">Enter your email to receive a password reset link</p>
          </div>

          {/* Form */}
          <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
            {!success ? (
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Email Field */}
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    id="email"
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    placeholder="Enter your email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>

                {/* Error Message */}
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                    {error}
                  </div>
                )}

                {/* Send Reset Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-12 bg-gradient-to-r from-[#1F2937] to-[#111827] text-white font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Sending...' : 'Send Reset Link'}
                </button>
              </form>
            ) : (
              /* Success Message */
              <div className="text-center space-y-6">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Check Your Email</h3>
                  <p className="text-gray-600">
                    We've sent a password reset link to <strong>{email}</strong>
                  </p>
                </div>

                <div className="space-y-3">
                  <button
                    onClick={handleResend}
                    className="w-full bg-blue-600 text-white py-3 px-4 rounded-xl font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200"
                  >
                    Send Another Email
                  </button>
                  
                  <button
                    onClick={handleBackToLogin}
                    className="w-full text-gray-600 hover:text-gray-800 py-2 px-4 rounded-lg font-medium transition-colors duration-200"
                  >
                    Back to Login
                  </button>
                </div>
              </div>
            )}

            {/* Back to Login */}
            {!success && (
              <div className="mt-6 text-center">
                <button
                  onClick={handleBackToLogin}
                  className="text-blue-600 hover:text-blue-500 font-medium transition-colors"
                >
                  Back to Login
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Right Panel - Dark Dashboard Preview (42% width) */}
      <div className="w-[42%] bg-gradient-to-b from-[#0E1129] to-[#1D233A] rounded-tr-xl rounded-br-xl relative overflow-hidden">
        {/* Slider Container */}
        <div className="relative h-full">
          {slides.map((slide, index) => (
            <div
              key={index}
              className={`absolute inset-0 transition-all duration-700 ease-in-out ${
                index === currentSlide ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-full'
              }`}
            >
              {/* Dashboard Preview Content */}
              <div className="p-8 h-full flex flex-col">
                {/* Analytics Cards */}
                <div className="grid grid-cols-2 gap-4 mb-8">
                  {slide.cards.map((card, cardIndex) => (
                    <div key={cardIndex} className="bg-white/10 backdrop-blur-sm rounded-lg p-4 shadow-lg">
                      <div className="text-2xl mb-3">{card.icon}</div>
                      <div className="h-3 bg-white/20 rounded w-3/4 mb-2"></div>
                      <div className="h-2 bg-white/10 rounded w-1/2"></div>
                    </div>
                  ))}
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
                    {slide.title}
                  </h2>
                  <p className="text-[#9CA3AF] text-sm mb-4 max-w-xs mx-auto">
                    {slide.subtitle}
                  </p>
                </div>
              </div>
            </div>
          ))}
          
          {/* Pagination Dots */}
          <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex items-center space-x-2">
            {slides.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`w-3 h-3 rounded-full transition-all duration-200 ${
                  index === currentSlide ? 'bg-white' : 'bg-white/30 hover:bg-white/50'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
