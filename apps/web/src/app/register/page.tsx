'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';

export default function RegisterPage() {
  const router = useRouter();
  const { signUpWithEmail, signInWithEmail } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
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

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError(''); // Clear error when user types
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    try {
      await signUpWithEmail(formData.email, formData.password);
      router.push('/dashboard');
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create account';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToLogin = () => {
    router.push('/');
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
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Create your Account</h1>
            <p className="text-gray-600">Join Climbly and start your career journey</p>
          </div>

          {/* Register Form */}
          <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Name Field */}
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  id="name"
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  placeholder="Enter your full name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                />
              </div>

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
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                />
              </div>

              {/* Password Field */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    required
                    className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    placeholder="Create a password"
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeSlashIcon className="h-5 w-5 text-gray-400" />
                    ) : (
                      <EyeIcon className="h-5 w-5 text-gray-400" />
                    )}
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">Must be at least 6 characters</p>
              </div>

              {/* Confirm Password Field */}
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                  Confirm Password
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    id="confirmPassword"
                    required
                    className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    placeholder="Confirm your password"
                    value={formData.confirmPassword}
                    onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeSlashIcon className="h-5 w-5 text-gray-400" />
                    ) : (
                      <EyeIcon className="h-5 w-5 text-gray-400" />
                    )}
                  </button>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              {/* Sign Up Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full h-12 bg-gradient-to-r from-[#1F2937] to-[#111827] text-white font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Creating Account...' : 'Sign Up'}
              </button>
            </form>

            {/* Back to Login */}
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Already have an account?{' '}
                <button
                  onClick={handleBackToLogin}
                  className="text-blue-600 hover:text-blue-500 font-medium transition-colors"
                >
                  Sign in here
                </button>
              </p>
            </div>
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
