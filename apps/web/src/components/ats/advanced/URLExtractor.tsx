'use client';

import React, { useState, useCallback } from 'react';
import { Link, ExternalLink, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

interface URLExtractorProps {
  onURLSubmit: (url: string) => Promise<void>;
  isProcessing: boolean;
}

export const URLExtractor: React.FC<URLExtractorProps> = ({
  onURLSubmit,
  isProcessing
}) => {
  const [url, setUrl] = useState('');
  const [status, setStatus] = useState<'idle' | 'validating' | 'extracting' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  // Supported platforms
  const supportedPlatforms = [
    { name: 'LinkedIn Profile', pattern: /linkedin\.com\/in\/[^\/]+/i, icon: '💼' },
    { name: 'GitHub Profile', pattern: /github\.com\/[^\/]+$/i, icon: '🐙' },
    { name: 'Portfolio Sites', pattern: /\.(com|org|net|io|dev)/, icon: '🌐' },
    { name: 'Google Drive', pattern: /drive\.google\.com/, icon: '📄' },
    { name: 'Dropbox', pattern: /dropbox\.com/, icon: '📦' },
    { name: 'OneDrive', pattern: /onedrive\.live\.com/, icon: '☁️' }
  ];

  // Validate URL
  const validateURL = useCallback((urlString: string): { isValid: boolean; platform?: string; error?: string } => {
    try {
      const urlObj = new URL(urlString);
      
      // Check if it's a supported platform
      const platform = supportedPlatforms.find(p => p.pattern.test(urlString));
      
      if (!platform) {
        return {
          isValid: false,
          error: 'URL platform not supported. Please use LinkedIn, GitHub, or other supported platforms.'
        };
      }

      return {
        isValid: true,
        platform: platform.name
      };
    } catch {
      return {
        isValid: false,
        error: 'Please enter a valid URL'
      };
    }
  }, []);

  // Handle URL submission
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!url.trim()) {
      setErrorMessage('Please enter a URL');
      setStatus('error');
      return;
    }

    setStatus('validating');
    setErrorMessage('');

    const validation = validateURL(url.trim());
    
    if (!validation.isValid) {
      setErrorMessage(validation.error || 'Invalid URL');
      setStatus('error');
      return;
    }

    setStatus('extracting');
    
    try {
      await onURLSubmit(url.trim());
      setStatus('success');
    } catch (error) {
      setStatus('error');
      setErrorMessage(error instanceof Error ? error.message : 'Failed to extract content from URL');
    }
  }, [url, validateURL, onURLSubmit]);

  // Get status icon
  const getStatusIcon = () => {
    switch (status) {
      case 'validating':
      case 'extracting':
        return <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />;
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-600" />;
      default:
        return <Link className="h-5 w-5 text-gray-400" />;
    }
  };

  // Get current platform
  const getCurrentPlatform = () => {
    if (url.trim()) {
      const platform = supportedPlatforms.find(p => p.pattern.test(url.trim()));
      return platform;
    }
    return null;
  };

  return (
    <div className="url-extractor">
      {/* URL Input Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="url-input" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Enter URL
          </label>
          <div className="relative">
            <input
              id="url-input"
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://linkedin.com/in/your-profile"
              className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
              disabled={isProcessing || status === 'extracting'}
            />
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              {getStatusIcon()}
            </div>
          </div>
        </div>

        {/* Platform Detection */}
        {url.trim() && (
          <div className="flex items-center space-x-2 text-sm">
            {getCurrentPlatform() ? (
              <>
                <span>{getCurrentPlatform()?.icon}</span>
                <span className="text-green-600 dark:text-green-400">
                  Detected: {getCurrentPlatform()?.name}
                </span>
              </>
            ) : (
              <span className="text-amber-600 dark:text-amber-400">
                ⚠️ Platform not recognized
              </span>
            )}
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={!url.trim() || isProcessing || status === 'extracting'}
          className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
        >
          {status === 'extracting' ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Extracting Content...</span>
            </>
          ) : (
            <>
              <ExternalLink className="h-4 w-4" />
              <span>Extract Content</span>
            </>
          )}
        </button>
      </form>

      {/* Status Messages */}
      {status === 'success' && (
        <div className="mt-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <span className="text-green-800 dark:text-green-200 font-medium">
              Content extracted successfully!
            </span>
          </div>
        </div>
      )}

      {status === 'error' && errorMessage && (
        <div className="mt-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <span className="text-red-800 dark:text-red-200">{errorMessage}</span>
          </div>
        </div>
      )}

      {/* Supported Platforms */}
      <div className="mt-6">
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          Supported Platforms
        </h4>
        <div className="grid grid-cols-2 gap-2">
          {supportedPlatforms.map((platform, index) => (
            <div key={index} className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
              <span>{platform.icon}</span>
              <span>{platform.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Usage Tips */}
      <div className="mt-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <h4 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">
          💡 Tips for better extraction
        </h4>
        <ul className="text-xs text-blue-700 dark:text-blue-300 space-y-1">
          <li>• Make sure your LinkedIn profile is public or you're logged in</li>
          <li>• GitHub profiles work best with a detailed README</li>
          <li>• Portfolio sites should have clear resume/about sections</li>
          <li>• Google Drive links should be publicly accessible</li>
        </ul>
      </div>
    </div>
  );
};

export default URLExtractor;
