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
        className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors duration-200 shadow-sm hover:shadow-md"
      >
        <Share2 className="w-5 h-5" />
        <span>Share Results</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-lg border border-gray-200 z-50 py-2">
          {/* Header */}
          <div className="px-4 py-2 border-b border-gray-100">
            <h3 className="font-semibold text-gray-900">Share Your Results</h3>
            <p className="text-sm text-gray-600">Spread the word about your ATS score!</p>
          </div>
          
          {/* Share Options */}
          <div className="py-2">
            {shareOptions.map((option) => {
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
                  className={`w-full flex items-center space-x-3 px-4 py-3 text-left transition-colors duration-200 ${option.bgColor}`}
                >
                  <Icon className={`w-5 h-5 ${option.color}`} />
                  <span className="font-medium text-gray-900">{option.name}</span>
                  {option.name === 'Copy Link' && copiedLink && (
                    <span className="text-xs text-green-600 ml-auto">Copied!</span>
                  )}
                </button>
              );
            })}
          </div>
          
          {/* URL Preview */}
          <div className="px-4 py-3 border-t border-gray-100">
            <div className="text-xs text-gray-500 mb-1">Share URL:</div>
            <div className="text-xs bg-gray-50 px-3 py-2 rounded-lg border font-mono break-all">
              {shareUrl}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
