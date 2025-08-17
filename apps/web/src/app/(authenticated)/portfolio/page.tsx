'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import ProtectedRoute from '@/components/ProtectedRoute';

interface PortfolioResult {
  portfolioUrl?: string;
  htmlContent?: string;
  message?: string;
}

export default function PortfolioPage() {
  // STEP 6: Wrap Portfolio page with ProtectedRoute to prevent flashing
  return (
    <ProtectedRoute>
      <PortfolioContent />
    </ProtectedRoute>
  );
}

function PortfolioContent() {
  const router = useRouter();
  const [resumeText, setResumeText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<PortfolioResult | null>(null);
  const [error, setError] = useState('');

  const handleGenerate = async () => {
    if (!resumeText.trim()) {
      setError('Please enter your resume text');
      return;
    }

    setIsGenerating(true);
    setError('');
    setResult(null);

    // Simulate API call
    setTimeout(() => {
      setResult({
        portfolioUrl: 'https://example.com/portfolio/ashish',
        htmlContent: '<div>Generated portfolio HTML would appear here...</div>',
        message: 'Portfolio generated successfully!'
      });
      setIsGenerating(false);
    }, 2000);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <button
          onClick={() => router.back()}
          className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeftIcon className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Portfolio Generator</h1>
          <p className="text-gray-600">Create a professional portfolio from your resume</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Resume Input */}
        <div className="backdrop-blur-lg bg-white/30 rounded-[16px] shadow-xl border border-white/50 p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Resume Text</h3>
          <textarea
            value={resumeText}
            onChange={(e) => setResumeText(e.target.value)}
            placeholder="Paste your resume text here to generate a portfolio..."
            className="w-full h-80 p-4 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
          />
          {error && (
            <p className="text-red-600 text-sm mt-2">{error}</p>
          )}
        </div>

        {/* Portfolio Preview */}
        <div className="backdrop-blur-lg bg-white/30 rounded-[16px] shadow-xl border border-white/50 p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Portfolio Preview</h3>
          <div className="h-80 bg-gray-50 rounded-lg p-4 border-2 border-dashed border-gray-300 flex items-center justify-center">
            {result ? (
              <div className="text-center">
                <div className="text-green-600 text-lg font-semibold mb-2">✅ {result.message}</div>
                {result.portfolioUrl && (
                  <a
                    href={result.portfolioUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 underline"
                  >
                    View Portfolio
                  </a>
                )}
              </div>
            ) : (
              <div className="text-center text-gray-500">
                <div className="text-4xl mb-2">📄</div>
                <p>Your portfolio will appear here</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Action Button */}
      <div className="flex justify-center">
        <button
          onClick={handleGenerate}
          disabled={!resumeText.trim() || isGenerating}
          className="bg-gradient-to-r from-green-500 to-green-600 text-white px-8 py-3 rounded-lg font-medium hover:shadow-lg transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isGenerating ? 'Generating...' : 'Generate Portfolio'}
        </button>
      </div>

      {/* Generated Content */}
      {result && result.htmlContent && (
        <div className="backdrop-blur-lg bg-white/30 rounded-[16px] shadow-xl border border-white/50 p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Generated HTML</h3>
          <div className="bg-gray-50 p-4 rounded-lg">
            <pre className="whitespace-pre-wrap text-gray-700 text-sm">{result.htmlContent}</pre>
          </div>
        </div>
      )}
    </div>
  );
}
