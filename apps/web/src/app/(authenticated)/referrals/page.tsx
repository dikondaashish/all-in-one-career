'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

interface ReferralSuggestion {
  id: string;
  name: string;
  title: string;
  company: string;
  email: string;
  linkedin: string;
  notes: string;
  matchScore: number;
}

export default function ReferralsPage() {
  const { user, loading, hasSkippedAuth } = useAuth();
  const router = useRouter();
  const [company, setCompany] = useState('');
  const [role, setRole] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [suggestions, setSuggestions] = useState<ReferralSuggestion[]>([]);
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

  const handleSearch = async () => {
    if (!company.trim() || !role.trim()) {
      setError('Please enter both company and role');
      return;
    }

    setIsSearching(true);
    setError('');
    setSuggestions([]);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/referrals/suggest?company=${encodeURIComponent(company)}&role=${encodeURIComponent(role)}`,
        {
          headers: {
            'Authorization': `Bearer ${await user.getIdToken()}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch referral suggestions');
      }

      const result = await response.json();
      setSuggestions(result.suggestions || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSearching(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Referral Marketplace</h1>
      
      {/* Search Form */}
      <div className="bg-white p-6 rounded-lg shadow mb-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label htmlFor="company" className="block text-sm font-medium text-gray-700 mb-2">
              Company
            </label>
            <input
              type="text"
              id="company"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter company name"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
            />
          </div>

          <div>
            <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-2">
              Role
            </label>
            <input
              type="text"
              id="role"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter job role"
              value={role}
              onChange={(e) => setRole(e.target.value)}
            />
          </div>

          <div className="flex items-end">
            <button
              onClick={handleSearch}
              disabled={isSearching}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-6 py-2 rounded-md font-medium transition-colors"
            >
              {isSearching ? 'Searching...' : 'Find Referrals'}
            </button>
          </div>
        </div>

        {error && (
          <div className="mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
            {error}
          </div>
        )}
      </div>

      {/* Results */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Referral Suggestions
          {suggestions.length > 0 && (
            <span className="ml-2 text-sm font-normal text-gray-500">
              ({suggestions.length} found)
            </span>
          )}
        </h2>

        {suggestions.length === 0 && !isSearching && (
          <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
            <p className="text-gray-500">
              Enter a company and role to find referral suggestions
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {suggestions.map((suggestion) => (
            <div key={suggestion.id} className="bg-white rounded-lg shadow border overflow-hidden">
              <div className="p-6">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-gray-900">{suggestion.name}</h3>
                    <p className="text-sm text-gray-600">{suggestion.title}</p>
                    <p className="text-sm text-gray-600">{suggestion.company}</p>
                  </div>
                  <div className="text-right">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      {suggestion.matchScore}% match
                    </span>
                  </div>
                </div>

                {suggestion.notes && (
                  <p className="text-sm text-gray-700 mb-4">{suggestion.notes}</p>
                )}

                <div className="space-y-2">
                  {suggestion.email && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Email:</span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-900 truncate max-w-32">
                          {suggestion.email}
                        </span>
                        <button
                          onClick={() => copyToClipboard(suggestion.email)}
                          className="text-blue-600 hover:text-blue-800 text-sm"
                        >
                          Copy
                        </button>
                      </div>
                    </div>
                  )}

                  {suggestion.linkedin && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">LinkedIn:</span>
                      <a
                        href={suggestion.linkedin}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 text-sm truncate max-w-32"
                      >
                        View Profile
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
