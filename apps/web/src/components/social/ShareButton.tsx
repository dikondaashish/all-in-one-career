/**
 * Social Share Button Component - Share ATS results with copy link functionality
 */

import React, { useState, useRef, useEffect } from 'react';
import { 
  Share2, 
  Copy, 
  Check, 
  Facebook, 
  Twitter, 
  Linkedin, 
  Instagram,
  MessageCircle,
  Mail
} from 'lucide-react';

interface ShareButtonProps {
  scanId: string;
  score?: number;
  title?: string;
}

export const ShareButton: React.FC<ShareButtonProps> = ({ 
  scanId, 
  score = 0, 
  title = "Check out my ATS Score!" 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const shareUrl = `${window.location.origin}/ats-scanner/results/${scanId}`;
  const shareText = `I just analyzed my resume with AI! Got a ${score}/100 ATS score. Check out the detailed insights:`;
  
  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch (err) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = shareUrl;
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      try {
        document.execCommand('copy');
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2000);
      } catch (fallbackErr) {
        console.error('Failed to copy link:', fallbackErr);
      }
      document.body.removeChild(textArea);
    }
  };

  const shareOptions = [
    {
      name: 'Copy Link',
      icon: copiedLink ? Check : Copy,
      action: copyToClipboard,
      color: copiedLink ? 'text-green-600' : 'text-gray-600',
      bgColor: copiedLink ? 'hover:bg-green-50' : 'hover:bg-gray-50'
    },
    {
      name: 'LinkedIn',
      icon: Linkedin,
      action: () => {
        const url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`;
        window.open(url, '_blank', 'width=600,height=400');
      },
      color: 'text-blue-600',
      bgColor: 'hover:bg-blue-50'
    },
    {
      name: 'Twitter',
      icon: Twitter,
      action: () => {
        const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
        window.open(url, '_blank', 'width=600,height=400');
      },
      color: 'text-blue-400',
      bgColor: 'hover:bg-blue-50'
    },
    {
      name: 'Facebook',
      icon: Facebook,
      action: () => {
        const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(shareText)}`;
        window.open(url, '_blank', 'width=600,height=400');
      },
      color: 'text-blue-700',
      bgColor: 'hover:bg-blue-50'
    },
    {
      name: 'Email',
      icon: Mail,
      action: () => {
        const subject = encodeURIComponent(title);
        const body = encodeURIComponent(`${shareText}\n\n${shareUrl}`);
        window.location.href = `mailto:?subject=${subject}&body=${body}`;
      },
      color: 'text-gray-600',
      bgColor: 'hover:bg-gray-50'
    },
    {
      name: 'WhatsApp',
      icon: MessageCircle,
      action: () => {
        const text = encodeURIComponent(`${shareText} ${shareUrl}`);
        window.open(`https://wa.me/?text=${text}`, '_blank');
      },
      color: 'text-green-600',
      bgColor: 'hover:bg-green-50'
    }
  ];

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="group relative overflow-hidden bg-gradient-to-r from-blue-500 via-blue-600 to-purple-600 hover:from-blue-600 hover:via-purple-600 hover:to-purple-700 text-white font-semibold py-3 px-6 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 ease-out border border-blue-500/20"
      >
        {/* Animated Background Gradient */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-400/20 to-purple-600/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        
        {/* Shimmer Effect */}
        <div className="absolute inset-0 -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
        
        {/* Content */}
        <div className="relative flex items-center space-x-3">
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-white/10 group-hover:bg-white/20 transition-colors duration-300">
            <Share2 className="w-5 h-5 text-white group-hover:rotate-12 transition-transform duration-300" />
          </div>
          
          <div className="flex flex-col items-start">
            <span className="text-sm font-bold tracking-wide">Share Results</span>
            <span className="text-xs text-blue-100 font-medium">Tell the world</span>
          </div>
          
          {/* Pulse indicator */}
          <div className="relative">
            <div className="w-2 h-2 bg-white rounded-full"></div>
            <div className="absolute inset-0 w-2 h-2 bg-white rounded-full animate-ping opacity-75"></div>
          </div>
        </div>
        
        {/* Glow Effect */}
        <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-blue-500/20 blur-xl -z-10"></div>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-3 w-72 bg-white/95 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/20 z-50 py-3 transform transition-all duration-300 ease-out scale-100 opacity-100">
          {/* Header with Gradient */}
          <div className="px-5 py-3 border-b border-gradient-to-r from-blue-100 to-purple-100">
            <div className="relative">
              <h3 className="font-bold text-gray-900 text-lg bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Share Your Results ✨
              </h3>
              <p className="text-sm text-gray-600 mt-1">Spread the word about your amazing ATS score!</p>
            </div>
          </div>
          
          {/* Share Options with Enhanced Design */}
          <div className="py-3 space-y-1">
            {shareOptions.map((option, index) => {
              const Icon = option.icon;
              return (
                <button
                  key={option.name}
                  onClick={() => {
                    option.action();
                    if (option.name !== 'Copy Link') {
                      setIsOpen(false);
                    }
                  }}
                  className={`w-full flex items-center space-x-4 px-5 py-3 text-left transition-all duration-300 hover:bg-gradient-to-r hover:from-gray-50 hover:to-gray-100 group relative overflow-hidden ${option.bgColor}`}
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  {/* Icon with enhanced styling */}
                  <div className={`flex items-center justify-center w-10 h-10 rounded-xl ${option.bgColor.replace('hover:', '')} group-hover:scale-110 transition-transform duration-300`}>
                    <Icon className={`w-5 h-5 ${option.color} group-hover:scale-110 transition-transform duration-300`} />
                  </div>
                  
                  <div className="flex-1">
                    <span className="font-semibold text-gray-900 group-hover:text-gray-700 transition-colors duration-300">
                      {option.name}
                    </span>
                    {option.name === 'Copy Link' && (
                      <div className="text-xs text-gray-500">Click to copy URL</div>
                    )}
                  </div>
                  
                  {option.name === 'Copy Link' && copiedLink && (
                    <div className="flex items-center space-x-1 text-green-600 animate-fade-in">
                      <Check className="w-4 h-4" />
                      <span className="text-xs font-medium">Copied!</span>
                    </div>
                  )}
                  
                  {/* Hover shimmer effect */}
                  <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
                </button>
              );
            })}
          </div>
          
          {/* Enhanced URL Preview */}
          <div className="px-5 py-4 border-t border-gray-100 bg-gradient-to-r from-gray-50/50 to-blue-50/50">
            <div className="flex items-center space-x-2 mb-2">
              <Share2 className="w-4 h-4 text-blue-500" />
              <span className="text-xs font-semibold text-gray-700">Share URL</span>
            </div>
            <div className="text-xs bg-white px-4 py-3 rounded-xl border border-gray-200 font-mono break-all shadow-inner relative group">
              {shareUrl}
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </div>
          </div>
          
          {/* Decorative elements */}
          <div className="absolute top-4 right-4 w-2 h-2 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full animate-pulse"></div>
          <div className="absolute bottom-4 left-4 w-1 h-1 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full animate-pulse animation-delay-500"></div>
        </div>
      )}
    </div>
  );
};
