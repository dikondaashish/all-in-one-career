'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';


// Force dynamic rendering to prevent static generation issues
export const dynamic = 'force-dynamic';

interface EmailForm {
  company: string;
  role: string;
  tone: string;
  resumeSummary: string;
  jdHighlights: string;
}

interface EmailResult {
  subject: string;
  body: string;
}

export default function EmailsPage() {
  const { user, loading, hasSkippedAuth } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState<EmailForm>({
    company: '',
    role: '',
    tone: 'professional',
    resumeSummary: '',
    jdHighlights: ''
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<EmailResult | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!loading && !user && !hasSkippedAuth()) {
      router.push('/');
    }
  }, [user, loading, hasSkippedAuth, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user && !hasSkippedAuth()) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!form.company.trim() || !form.role.trim()) {
      setError('Company and Role are required');
      return;
    }

    setIsGenerating(true);
    setError('');
    setResult(null);

    try {
      const response = await fetch('/api/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user ? await user.getIdToken() : ''}`,
        },
        body: JSON.stringify(form),
      });

      if (!response.ok) {
        throw new Error('Failed to generate email');
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

  const handleInputChange = (field: keyof EmailForm, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">AI Email Generator</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Form Section */}
        <div className="space-y-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="company" className="block text-sm font-medium text-gray-700 mb-2">
                Company *
              </label>
              <input
                type="text"
                id="company"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter company name"
                value={form.company}
                onChange={(e) => handleInputChange('company', e.target.value)}
              />
            </div>

            <div>
              <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-2">
                Role *
              </label>
              <input
                type="text"
                id="role"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter job role/title"
                value={form.role}
                onChange={(e) => handleInputChange('role', e.target.value)}
              />
            </div>

            <div>
              <label htmlFor="tone" className="block text-sm font-medium text-gray-700 mb-2">
                Tone
              </label>
              <select
                id="tone"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                value={form.tone}
                onChange={(e) => handleInputChange('tone', e.target.value)}
              >
                <option value="professional">Professional</option>
                <option value="friendly">Friendly</option>
                <option value="enthusiastic">Enthusiastic</option>
                <option value="formal">Formal</option>
                <option value="casual">Casual</option>
              </select>
            </div>

            <div>
              <label htmlFor="resumeSummary" className="block text-sm font-medium text-gray-700 mb-2">
                Resume Summary
              </label>
              <textarea
                id="resumeSummary"
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Brief summary of your relevant experience..."
                value={form.resumeSummary}
                onChange={(e) => handleInputChange('resumeSummary', e.target.value)}
              />
            </div>

            <div>
              <label htmlFor="jdHighlights" className="block text-sm font-medium text-gray-700 mb-2">
                Job Description Highlights
              </label>
              <textarea
                id="jdHighlights"
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Key requirements or highlights from the job description..."
                value={form.jdHighlights}
                onChange={(e) => handleInputChange('jdHighlights', e.target.value)}
              />
            </div>

            <button
              type="submit"
              disabled={isGenerating}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-6 py-3 rounded-md font-medium transition-colors"
            >
              {isGenerating ? 'Generating Email...' : 'Generate Email'}
            </button>
          </form>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
              {error}
            </div>
          )}
        </div>

        {/* Results Section */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-900">Generated Email</h2>
          
          {!result ? (
            <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <p className="text-gray-500">
                Your AI-generated email will appear here
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-white p-4 rounded-lg border">
                <h3 className="font-medium text-gray-900 mb-2">Subject</h3>
                <div className="flex items-center justify-between">
                  <span className="text-gray-700">{result.subject}</span>
                  <button
                    onClick={() => copyToClipboard(result.subject)}
                    className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-1 rounded text-sm"
                  >
                    Copy
                  </button>
                </div>
              </div>

              <div className="bg-white p-4 rounded-lg border">
                <h3 className="font-medium text-gray-900 mb-2">Email Body</h3>
                <textarea
                  rows={12}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  value={result.body}
                  readOnly
                />
                <button
                  onClick={() => copyToClipboard(result.body)}
                  className="mt-2 bg-gray-600 hover:bg-gray-700 text-white px-3 py-1 rounded text-sm"
                >
                  Copy to Clipboard
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
