'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Search, FileText, Briefcase, Mail, Users, Building, Calendar, Filter, X, MessageCircle } from 'lucide-react';

// Environment-based API configuration
const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://all-in-one-career.onrender.com'
  : 'http://localhost:4000';

interface SearchResult {
  type: 'Application' | 'Portfolio' | 'Referral' | 'Job Description';
  title: string;
  subInfo: string;
  id: string;
  link: string;
}

interface SearchResponse {
  query: string;
  extractedKeywords: string;
  filters: {
    model?: string;
    status?: string;
    dateRange?: number;
  };
  results: SearchResult[];
  totalResults: number;
}

interface AskResponse {
  type: 'answer' | 'results' | 'both';
  answer?: string;
  results?: SearchResult[];
}

interface SearchFilters {
  model: string;
  dateRange: string;
}

export default function SmartSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<SearchFilters>({
    model: 'all',
    dateRange: 'all'
  });
  const [aiResponse, setAiResponse] = useState<AskResponse | null>(null);
  const router = useRouter();
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Check if query is a question
  const isQuestion = (text: string) => text.trim().endsWith('?');

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
        setShowFilters(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const performSearch = useCallback(async (searchQuery: string) => {
    setIsLoading(true);
    setError(null);
    setAiResponse(null);
    
    try {
      // Build query parameters
      const params = new URLSearchParams({
        query: searchQuery
      });
      
      if (filters.model !== 'all') {
        params.append('model', filters.model);
      }
      
      if (filters.dateRange !== 'all') {
        params.append('dateRange', filters.dateRange);
      }
      
      console.log(`Searching for: "${searchQuery}" with filters:`, filters);
      const response = await fetch(`${API_BASE_URL}/api/search?${params.toString()}`);
      
      if (!response.ok) {
        const errorData = await response.text();
        console.error('Search API error:', response.status, errorData);
        throw new Error(`Search failed: ${response.status} ${response.statusText}`);
      }
      
      const data: SearchResponse = await response.json();
      console.log('Search results:', data);
      setResults(data.results);
      setShowDropdown(data.results.length > 0);
    } catch (err) {
      console.error('Search error:', err);
      setError(err instanceof Error ? err.message : 'Search failed');
      setResults([]);
      setShowDropdown(false);
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (query.trim().length > 0) {
        if (isQuestion(query.trim())) {
          performAIQuestion(query.trim());
        } else {
          performSearch(query.trim());
        }
      } else {
        setResults([]);
        setAiResponse(null);
        setShowDropdown(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query, filters, performSearch]);

  const performAIQuestion = async (question: string) => {
    setIsLoading(true);
    setError(null);
    setResults([]);
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/ask`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ question }),
      });
      
      if (!response.ok) {
        throw new Error('AI Q&A failed');
      }
      
      const data: AskResponse = await response.json();
      setAiResponse(data);
      
      // Show dropdown if we have any content
      if (data.answer || (data.results && data.results.length > 0)) {
        setShowDropdown(true);
      }
      
      // Set results if available
      if (data.results) {
        setResults(data.results);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'AI Q&A failed');
      setAiResponse(null);
      setShowDropdown(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResultClick = (result: SearchResult) => {
    setShowDropdown(false);
    setQuery('');
    setAiResponse(null);
    router.push(result.link);
  };

  const handleFilterChange = (filterType: keyof SearchFilters, value: string) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };

  const clearFilters = () => {
    setFilters({
      model: 'all',
      dateRange: 'all'
    });
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'Application':
        return <FileText className="w-4 h-4 text-blue-600" />;
      case 'Portfolio':
        return <Briefcase className="w-4 h-4 text-green-600" />;
      case 'Email':
        return <Mail className="w-4 h-4 text-purple-600" />;
      case 'Referral':
        return <Users className="w-4 h-4 text-orange-600" />;
      case 'Job Description':
        return <Building className="w-4 h-4 text-indigo-600" />;
      default:
        return <Calendar className="w-4 h-4 text-gray-600" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'Application':
        return 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-300';
      case 'Portfolio':
        return 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-800 dark:text-green-300';
      case 'Email':
        return 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800 text-purple-800 dark:text-purple-300';
      case 'Referral':
        return 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800 text-orange-800 dark:text-orange-300';
      case 'Job Description':
        return 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-800 text-indigo-800 dark:text-indigo-300';
      default:
        return 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-600 text-gray-800 dark:text-gray-300';
    }
  };

  const getFilterDisplayText = () => {
    const parts = [];
    if (filters.model !== 'all') {
      parts.push(filters.model.charAt(0).toUpperCase() + filters.model.slice(1));
    }
    if (filters.dateRange !== 'all') {
      parts.push(`Last ${filters.dateRange}d`);
    }
    return parts.length > 0 ? parts.join(' • ') : null;
  };

  const hasActiveFilters = filters.model !== 'all' || filters.dateRange !== 'all';

  return (
    <div className="relative" ref={searchRef}>
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-5 h-5" />
        <input
          ref={inputRef}
          type="text"
          placeholder={isQuestion(query) ? "Ask me anything about your career data..." : "Search applications, portfolios, emails..."}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => {
            if (results.length > 0 || aiResponse) setShowDropdown(true);
          }}
          className="w-full pl-12 pr-20 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-full focus:outline-none focus:ring-2 focus:ring-[#006B53] dark:focus:ring-[#00d4aa] focus:border-transparent text-sm transition-all duration-200 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
        />
        
        {/* AI Q&A Indicator */}
        {isQuestion(query.trim()) && (
          <div className="absolute right-16 top-1/2 transform -translate-y-1/2 flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-xs font-medium">
            <MessageCircle className="w-3 h-3" />
            AI
          </div>
        )}
        
        {/* Advanced Filter Button */}
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`absolute right-16 top-1/2 transform -translate-y-1/2 p-1.5 rounded-full transition-all duration-200 ${
            hasActiveFilters 
              ? 'bg-[#006B53] dark:bg-[#00d4aa] text-white dark:text-black' 
              : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
          }`}
          title="Advanced filters"
        >
          <Filter className="w-4 h-4" />
        </button>
        
        <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="p-1 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              title="Clear filters"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Active Filter Tags */}
      {hasActiveFilters && (
        <div className="mt-2 flex items-center space-x-2">
          <span className="text-xs text-gray-500">Filters:</span>
          <span className="inline-flex items-center px-2 py-1 bg-[#006B53]/10 text-[#006B53] text-xs rounded-full font-medium">
            {getFilterDisplayText()}
            <button
              onClick={clearFilters}
              className="ml-1 hover:bg-[#006B53]/20 rounded-full p-0.5 transition-colors"
            >
              <X className="w-3 h-3" />
            </button>
          </span>
        </div>
      )}

      {/* Advanced Filters Dropdown */}
      {showFilters && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg dark:shadow-xl p-4 z-50">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Model Type</label>
              <select
                value={filters.model}
                onChange={(e) => handleFilterChange('model', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#006B53] focus:border-transparent text-sm"
              >
                <option value="all">All Models</option>
                <option value="applications">Applications</option>
                <option value="portfolio">Portfolio</option>
                <option value="referrals">Referrals</option>
                <option value="job-descriptions">Job Descriptions</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Date Range</label>
              <select
                value={filters.dateRange}
                onChange={(e) => handleFilterChange('dateRange', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#006B53] focus:border-transparent text-sm"
              >
                <option value="all">All Time</option>
                <option value="7">Last 7 days</option>
                <option value="30">Last 30 days</option>
                <option value="90">Last 90 days</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Loading Indicator */}
      {isLoading && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg p-4">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#006B53]"></div>
            <span className="text-sm text-gray-600">
              {isQuestion(query) ? 'Thinking...' : 'Searching...'}
            </span>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-red-50 border border-red-200 rounded-lg shadow-lg p-4">
          <div className="flex items-center">
            <span className="text-sm text-red-600">Error: {error}</span>
          </div>
        </div>
      )}

      {/* AI Q&A Response */}
      {showDropdown && aiResponse?.answer && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg dark:shadow-xl p-4 z-50">
          <div className="p-4">
            {/* AI Answer Bubble */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <div className="flex items-start space-x-3">
                <MessageCircle className="w-5 h-5 text-blue-600 mt-1 flex-shrink-0" />
                <div className="flex-1">
                  <div className="text-sm font-medium text-blue-800 mb-2">AI Career Coach</div>
                  <div className="text-sm text-blue-700 italic leading-relaxed">
                    {aiResponse.answer}
                  </div>
                </div>
              </div>
            </div>

            {/* Results if available */}
            {aiResponse.results && aiResponse.results.length > 0 && (
              <>
                <div className="text-xs text-gray-500 px-2 py-2 border-b border-gray-100 mb-2">
                  Related items found
                </div>
                {aiResponse.results.map((result) => (
                  <button
                    key={`${result.type}-${result.id}`}
                    onClick={() => handleResultClick(result)}
                    className="w-full text-left p-3 hover:bg-gray-50 rounded-lg transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-[#006B53] focus:ring-opacity-50 mb-2"
                  >
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 mt-1">
                        {getTypeIcon(result.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getTypeColor(result.type)}`}>
                            {result.type}
                          </span>
                        </div>
                        <div className="text-sm font-medium text-gray-900 truncate">
                          {result.title}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {result.subInfo}
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </>
            )}
          </div>
        </div>
      )}

      {/* Search Results Dropdown */}
      {showDropdown && !aiResponse?.answer && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg dark:shadow-xl max-h-96 overflow-y-auto z-50">
          <div className="p-2">
            <div className="text-xs text-gray-500 dark:text-gray-400 px-3 py-2 border-b border-gray-100 dark:border-gray-700">
              {results.length} result{results.length !== 1 ? 's' : ''} found
            </div>
            {results.map((result, index) => (
              <div
                key={index}
                onClick={() => handleResultClick(result)}
                className="flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg cursor-pointer transition-colors"
              >
                <div className={`p-2 rounded-lg border ${getTypeColor(result.type)} dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300`}>
                  {getTypeIcon(result.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {result.title}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {result.subInfo}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* No Results */}
      {showDropdown && !isLoading && results.length === 0 && !aiResponse?.answer && query.trim().length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg p-4">
          <div className="text-center text-sm text-gray-500">
            {error ? (
              <div className="text-red-600">
                <div className="font-medium mb-1">Search Error</div>
                <div className="text-xs">{error}</div>
              </div>
            ) : isQuestion(query) ? (
              "Sorry, I couldn't understand your question. Try rephrasing it."
            ) : (
              `No matches found for "${query}"`
            )}
          </div>
        </div>
      )}
    </div>
  );
}
