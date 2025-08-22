'use client';

import { useState, useEffect } from 'react';

import { Search, TrendingUp, BarChart3, MessageCircle, Clock } from 'lucide-react';

// Force dynamic rendering to prevent static generation issues
export const dynamic = 'force-dynamic';

// Environment-based API configuration
const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://all-in-one-career.onrender.com'
  : 'http://localhost:4000';

interface SearchInsights {
  totalSearches: number;
  topKeywords: Array<{ keyword: string; count: number }>;
  longestQueries: Array<{ query: string; length: number }>;
  recentQueries: Array<{ query: string; answer?: string | null; createdAt: Date }>;
}

export default function SearchInsightsPage() {

  const [insights, setInsights] = useState<SearchInsights | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSearchInsights();
  }, []);

  const fetchSearchInsights = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`${API_BASE_URL}/api/search-insights`, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch search insights');
      }

      const data = await response.json();
      setInsights(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch insights');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const truncateText = (text: string, maxLength: number) => {
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F0F2F5] pt-18">
        <div className="p-8">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#006B53]"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#F0F2F5] pt-18">
        <div className="p-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <div className="text-red-600 text-lg font-medium mb-2">Error Loading Insights</div>
            <div className="text-red-500">{error}</div>
            <button
              onClick={fetchSearchInsights}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F0F2F5] pt-18">
      <div className="p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Search Insights</h1>
          <p className="text-gray-600">Analytics and history of your search activity</p>
        </div>

        {insights && (
          <div className="space-y-8">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Total Searches */}
              <div className="bg-white rounded-2xl p-6 shadow-[0px_12px_30px_rgba(0,0,0,0.05)]">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Searches</p>
                    <p className="text-3xl font-bold text-gray-900">{insights.totalSearches}</p>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                    <Search className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
              </div>

              {/* Top Keywords */}
              <div className="bg-white rounded-2xl p-6 shadow-[0px_12px_30px_rgba(0,0,0,0.05)]">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Top Keywords</p>
                    <p className="text-3xl font-bold text-gray-900">
                      {insights.topKeywords.length > 0 ? insights.topKeywords[0].keyword : 'N/A'}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-green-600" />
                  </div>
                </div>
              </div>

              {/* Longest Query */}
              <div className="bg-white rounded-2xl p-6 shadow-[0px_12px_30px_rgba(0,0,0,0.05)]">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Longest Query</p>
                    <p className="text-3xl font-bold text-gray-900">
                      {insights.longestQueries.length > 0 ? insights.longestQueries[0].length : 0}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                    <BarChart3 className="w-6 h-6 text-purple-600" />
                  </div>
                </div>
              </div>

              {/* Recent Activity */}
              <div className="bg-white rounded-2xl p-6 shadow-[0px_12px_30px_rgba(0,0,0,0.05)]">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Recent Activity</p>
                    <p className="text-3xl font-bold text-gray-900">
                      {insights.recentQueries.length}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                    <Clock className="w-6 h-6 text-orange-600" />
                  </div>
                </div>
              </div>
            </div>

            {/* Top Keywords Chart */}
            <div className="bg-white rounded-2xl p-6 shadow-[0px_12px_30px_rgba(0,0,0,0.05)]">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Top Keywords</h2>
              <div className="space-y-3">
                {insights.topKeywords.map((keyword, index) => (
                  <div key={keyword.keyword} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <span className="w-6 h-6 bg-[#006B53] text-white rounded-full flex items-center justify-center text-sm font-medium">
                        {index + 1}
                      </span>
                      <span className="font-medium text-gray-900">{keyword.keyword}</span>
                    </div>
                    <span className="text-sm text-gray-500">{keyword.count} searches</span>
                  </div>
                ))}
                {insights.topKeywords.length === 0 && (
                  <p className="text-gray-500 text-center py-4">No keyword data available</p>
                )}
              </div>
            </div>

            {/* Recent Search History */}
            <div className="bg-white rounded-2xl p-6 shadow-[0px_12px_30px_rgba(0,0,0,0.05)]">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Search History</h2>
              <div className="space-y-4">
                {insights.recentQueries.map((query, index) => (
                  <div key={index} className="border-b border-gray-100 pb-4 last:border-b-0">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <Search className="w-4 h-4 text-gray-400" />
                          <span className="text-sm font-medium text-gray-900">
                            {truncateText(query.query, 80)}
                          </span>
                        </div>
                        {query.answer && (
                          <div className="flex items-center space-x-2 ml-6">
                            <MessageCircle className="w-4 h-4 text-blue-400" />
                            <span className="text-sm text-gray-600 italic">
                              {truncateText(query.answer, 120)}
                            </span>
                          </div>
                        )}
                      </div>
                      <span className="text-xs text-gray-400 ml-4">
                        {formatDate(query.createdAt.toString())}
                      </span>
                    </div>
                  </div>
                ))}
                {insights.recentQueries.length === 0 && (
                  <p className="text-gray-500 text-center py-4">No search history available</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
