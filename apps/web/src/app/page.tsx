'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';

export default function LandingPage() {
  const router = useRouter();
  const { signIn, signInWithEmail } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false
  });
  const [isLoading, setIsLoading] = useState(false);

  // Load remember me state from localStorage
  useEffect(() => {
    const remembered = localStorage.getItem('rememberMe') === 'true';
    setFormData(prev => ({ ...prev, rememberMe: remembered }));
  }, []);

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Save remember me state to localStorage
    if (field === 'rememberMe') {
      localStorage.setItem('rememberMe', value.toString());
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      if (formData.email && formData.password) {
        await signInWithEmail(formData.email, formData.password);
      } else {
        await signIn(); // Fallback to Google auth
      }
      router.push('/dashboard');
    } catch (error) {
      console.error('Sign in error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkip = () => {
    router.push('/dashboard');
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      await signIn();
      router.push('/dashboard');
    } catch (error) {
      console.error('Google sign in error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAppleSignIn = () => {
    // Apple Sign In implementation would go here
    console.log('Apple Sign In clicked');
  };

  const handleForgotPassword = () => {
    router.push('/forgot-password');
  };

  const handleRegister = () => {
    router.push('/register');
  };

  const handlePrivacyPolicy = () => {
    router.push('/privacy-policy');
  };

  const handleTerms = () => {
    router.push('/terms');
  };

  return (
    <div className="min-h-screen bg-[#E5E5E5] flex font-['Inter'] tracking-normal">
      {/* Left Panel - White Login (58% width) */}
      <div className="w-[58%] bg-white flex items-center justify-center px-16">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="flex justify-center mb-8">
            <div className="w-12 h-12 bg-orange-500 rounded-lg flex items-center justify-center shadow-lg">
              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            </div>
          </div>

          {/* Heading */}
          <h1 className="text-2xl font-bold text-gray-900 text-center mb-2">
            Welcome Back to Climbly
          </h1>
          <p className="text-[#6B7280] text-center mb-8">
            Enter your username and password to continue.
          </p>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Field */}
            <div>
              <input
                type="email"
                placeholder="Enter your email address"
                required
                className="w-full h-12 px-4 border border-[#D1D5DB] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
              />
            </div>

            {/* Password Field */}
            <div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  required
                  className="w-full h-12 px-4 pr-12 border border-[#D1D5DB] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  checked={formData.rememberMe}
                  onChange={(e) => handleInputChange('rememberMe', e.target.checked)}
                />
                <span className="ml-2 text-sm text-gray-700">Remember me</span>
              </label>
              <button
                type="button"
                onClick={handleForgotPassword}
                className="text-sm text-blue-600 hover:text-blue-500 transition-colors"
              >
                Forgot password?
              </button>
            </div>

            {/* Sign In Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 bg-gradient-to-r from-[#1F2937] to-[#111827] text-white font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Signing In...' : 'Sign In'}
            </button>
          </form>

          {/* Divider */}
          <div className="my-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">or login with</span>
              </div>
            </div>
          </div>

          {/* Social Login Buttons */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              className="flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50"
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Google
            </button>

            <button
              onClick={handleAppleSignIn}
              disabled={true}
              className="flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
              </svg>
              Apple
            </button>
          </div>

          {/* Register Link */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Don't have an account?{' '}
              <button
                onClick={handleRegister}
                className="text-blue-600 hover:text-blue-500 font-medium transition-colors"
              >
                Register
              </button>
            </p>
          </div>

          {/* Skip Button */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <button
              onClick={handleSkip}
              className="w-full text-gray-600 hover:text-gray-800 py-2 px-4 rounded-lg font-medium transition-colors duration-200"
            >
              Skip for now
            </button>
          </div>

          {/* Footer */}
          <div className="mt-12 text-center">
            <div className="text-sm text-gray-400">
              <button
                onClick={handlePrivacyPolicy}
                className="hover:text-gray-600 transition-colors"
              >
                Privacy Policy
              </button>
              {' · '}
              <button
                onClick={handleTerms}
                className="hover:text-gray-600 transition-colors"
              >
                Terms & Conditions
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Dark Dashboard Preview (42% width) */}
      <div className="w-[42%] bg-gradient-to-b from-[#0E1129] to-[#1D233A] rounded-tr-xl rounded-br-xl relative overflow-hidden">
        {/* Dashboard Preview Content */}
        <div className="p-8 h-full flex flex-col">
          {/* Analytics Cards */}
          <div className="grid grid-cols-2 gap-4 mb-8">
            {/* Card 1 */}
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 shadow-lg">
              <div className="w-12 h-12 bg-blue-500/20 rounded-lg mb-3"></div>
              <div className="h-3 bg-white/20 rounded w-3/4 mb-2"></div>
              <div className="h-2 bg-white/10 rounded w-1/2"></div>
            </div>
            
            {/* Card 2 */}
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 shadow-lg">
              <div className="w-12 h-12 bg-green-500/20 rounded-lg mb-3"></div>
              <div className="h-3 bg-white/20 rounded w-2/3 mb-2"></div>
              <div className="h-2 bg-white/10 rounded w-3/4"></div>
            </div>
            
            {/* Card 3 */}
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 shadow-lg">
              <div className="w-12 h-12 bg-purple-500/20 rounded-lg mb-3"></div>
              <div className="h-3 bg-white/20 rounded w-4/5 mb-2"></div>
              <div className="h-2 bg-white/10 rounded w-1/2"></div>
            </div>
            
            {/* Card 4 */}
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 shadow-lg">
              <div className="w-12 h-12 bg-orange-500/20 rounded-lg mb-3"></div>
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
              Transform Data into Cool Insights
            </h2>
            <p className="text-[#9CA3AF] text-sm mb-4 max-w-xs mx-auto">
              Unlock the power of your data with our advanced analytics platform. 
              Get real-time insights and make data-driven decisions.
            </p>
            
            {/* Pagination Dots */}
            <div className="flex items-center justify-center space-x-2">
              <div className="w-2 h-2 bg-white rounded-full"></div>
              <div className="w-2 h-2 bg-white/30 rounded-full"></div>
              <div className="w-2 h-2 bg-white/30 rounded-full"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
