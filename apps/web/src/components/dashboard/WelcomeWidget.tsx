'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { ArrowRight, X, Sparkles } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface WelcomeWidgetProps {
  onDismiss?: () => void;
  showWidget?: boolean;
  userName?: string | null;
}

const WelcomeWidget = ({ onDismiss, showWidget = true, userName }: WelcomeWidgetProps) => {
  const [isVisible, setIsVisible] = useState(showWidget);
  const [isAnimating, setIsAnimating] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setIsVisible(showWidget);
  }, [showWidget]);

  const handleViewFeatures = () => {
    // Navigate to help page which contains features information
    router.push('/help');
    handleDismiss();
  };

  const handleDismiss = useCallback(() => {
    setIsAnimating(true);
    setTimeout(() => {
      setIsVisible(false);
      if (onDismiss) onDismiss();
    }, 300);
  }, [onDismiss]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isVisible) {
        handleDismiss();
      }
    };

    if (isVisible) {
      document.addEventListener('keydown', handleEscape);
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isVisible, handleDismiss]);

  if (!isVisible) return null;

  return (
    <div 
      className={`
        fixed inset-0 bg-black bg-opacity-40 backdrop-blur-sm z-50 
        flex items-center justify-center p-4
        transition-opacity duration-300 ${isAnimating ? 'opacity-0' : 'opacity-100'}
      `}
      onClick={(e) => {
        // Close when clicking backdrop
        if (e.target === e.currentTarget) {
          handleDismiss();
        }
      }}
    >
      {/* Welcome Card */}
      <div 
        className={`
          bg-white rounded-3xl shadow-2xl 
          w-full max-w-2xl 
          p-6 sm:p-8 md:p-12 
          text-center relative
          transform transition-all duration-300
          ${isAnimating ? 'scale-95 opacity-0' : 'scale-100 opacity-100'}
        `}
        role="dialog"
        aria-modal="true"
        aria-labelledby="welcome-title"
        aria-describedby="welcome-description"
      >
        {/* Close Button */}
        <button
          onClick={handleDismiss}
          className="absolute top-6 right-6 text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100"
          aria-label="Close welcome message"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Decorative Element */}
        <div className="mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-green-100 to-blue-100 rounded-full mb-6">
            <Sparkles className="w-8 h-8 text-green-600" />
          </div>
        </div>

        {/* Main Content */}
        <div className="space-y-6">
          {/* Welcome Heading */}
          <h1 
            id="welcome-title"
            className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 leading-tight"
          >
            Welcome{userName ? `, ${userName}` : ''}
          </h1>

          {/* Subtitle */}
          <p 
            id="welcome-description"
            className="text-base sm:text-lg md:text-xl text-gray-600 leading-relaxed max-w-lg mx-auto"
          >
            To your hub for career insights,
            <br className="hidden sm:block" />
            <span className="sm:hidden"> </span>activities, and more.
          </p>

          {/* Call to Action Buttons */}
          <div className="pt-4 space-y-3 sm:space-y-0 sm:space-x-4 sm:flex sm:justify-center">
            <button
              onClick={handleViewFeatures}
              className="
                inline-flex items-center justify-center space-x-2 sm:space-x-3 
                px-6 sm:px-8 py-3 sm:py-4 
                bg-[#006B53] hover:bg-[#005A47] text-white
                rounded-full font-medium text-base sm:text-lg
                transition-all duration-200 
                focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2
                w-full sm:w-auto
              "
            >
              <span>View All Features</span>
              <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
            
            <button
              onClick={handleDismiss}
              className="
                inline-flex items-center justify-center space-x-2 
                px-6 sm:px-8 py-3 sm:py-4 
                bg-white border-2 border-gray-300 rounded-full
                text-gray-700 font-medium text-base sm:text-lg
                hover:border-gray-400 hover:bg-gray-50
                transition-all duration-200 
                focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2
                w-full sm:w-auto
              "
            >
              <span>Maybe Later</span>
            </button>
          </div>
        </div>

        {/* Optional decorative elements */}
        <div className="absolute -top-4 -right-4 w-32 h-32 bg-green-100 rounded-full opacity-10 -z-10"></div>
        <div className="absolute -bottom-4 -left-4 w-24 h-24 bg-blue-100 rounded-full opacity-10 -z-10"></div>
      </div>
    </div>
  );
};

export default WelcomeWidget;
