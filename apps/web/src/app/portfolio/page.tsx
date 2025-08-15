'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

interface PortfolioResult {
  portfolioUrl?: string;
  htmlContent?: string;
  message?: string;
}

export default function PortfolioPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [resumeText, setResumeText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<PortfolioResult | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const handleGenerate = async () => {
    if (!resumeText.trim()) {
      setError('Please enter your resume text');
      return;
    }

    setIsGenerating(true);
    setError('');
    setResult(null);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/portfolio/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await user.getIdToken()}`,
        },
        body: JSON.stringify({ resumeText }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate portfolio');
      }

      const result = await response.json();
      setResult(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Portfolio Generator</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Input Section */}
        <div className="space-y-4">
          <div>
            <label htmlFor="resume" className="block text-sm font-medium text-gray-700 mb-2">
              Resume Text
            </label>
            <textarea
              id="resume"
              rows={15}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Paste your resume text here to generate a portfolio..."
              value={resumeText}
              onChange={(e) => setResumeText(e.target.value)}
            />
          </div>

          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-6 py-3 rounded-md font-medium transition-colors"
          >
            {isGenerating ? 'Generating Portfolio...' : 'Generate Portfolio'}
          </button>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
              {error}
            </div>
          )}
        </div>

        {/* Results Section */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-900">Generated Portfolio</h2>
          
          {!result ? (
            <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <p className="text-gray-500">
                Your portfolio will appear here after generation
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {result.portfolioUrl && (
                <div className="bg-white p-4 rounded-lg border">
                  <h3 className="font-medium text-gray-900 mb-2">Portfolio URL</h3>
                  <a
                    href={result.portfolioUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 break-all"
                  >
                    {result.portfolioUrl}
                  </a>
                  <button
                    onClick={() => copyToClipboard(result.portfolioUrl!)}
                    className="ml-2 bg-gray-600 hover:bg-gray-700 text-white px-3 py-1 rounded text-sm"
                  >
                    Copy
                  </button>
                </div>
              )}

              {result.htmlContent && (
                <div className="bg-white p-4 rounded-lg border">
                  <h3 className="font-medium text-gray-900 mb-2">HTML Content</h3>
                  <textarea
                    rows={10}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm font-mono"
                    value={result.htmlContent}
                    readOnly
                  />
                  <button
                    onClick={() => copyToClipboard(result.htmlContent!)}
                    className="mt-2 bg-gray-600 hover:bg-gray-700 text-white px-3 py-1 rounded text-sm"
                  >
                    Copy to Clipboard
                  </button>
                </div>
              )}

              {result.message && (
                <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-md">
                  {result.message}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
