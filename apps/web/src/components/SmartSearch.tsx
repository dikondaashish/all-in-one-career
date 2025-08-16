'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Search, FileText, Briefcase, Mail, Users, Building, Calendar, Filter, X, MessageCircle } from 'lucide-react';

interface SearchResult {
  type: 'Application' | 'ATS' | 'Portfolio' | 'Email' | 'Referral' | 'Task' | 'Job Description';
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

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (query.trim().length > 2) {
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
  }, [query, filters]);

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

  const performSearch = async (searchQuery: string) => {
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
      
      const response = await fetch(`/api/search?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error('Search failed');
      }
      
      const data: SearchResponse = await response.json();
      setResults(data.results);
      setShowDropdown(data.results.length > 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed');
      setResults([]);
      setShowDropdown(false);
    } finally {
      setIsLoading(false);
    }
  };

  const performAIQuestion = async (question: string) => {
    setIsLoading(true);
    setError(null);
    setResults([]);
    
    try {
      const response = await fetch('/api/ask', {
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
        return 'bg-blue-50 border-blue-200 text-blue-800';
      case 'Portfolio':
        return 'bg-green-50 border-green-200 text-green-800';
      case 'Email':
        return 'bg-purple-50 border-purple-200 text-purple-800';
      case 'Referral':
        return 'bg-orange-50 border-orange-200 text-orange-800';
      case 'Job Description':
        return 'bg-indigo-50 border-indigo-200 text-indigo-800';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800';
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
        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        <input
          ref={inputRef}
          type="text"
          placeholder={isQuestion(query) ? "Ask me anything about your career data..." : "Search applications, portfolios, emails..."}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => {
            if (results.length > 0 || aiResponse) setShowDropdown(true);
          }}
          className="w-full pl-12 pr-20 py-3 bg-gray-50 border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-[#006B53] focus:border-transparent text-sm transition-all duration-200"
        />
        
        {/* AI Q&A Indicator */}
        {isQuestion(query) && (
          <div className="absolute right-20 top-1/2 transform -translate-y-1/2">
            <MessageCircle className="w-4 h-4 text-[#006B53]" />
          </div>
        )}
        
        {/* Advanced Filter Button */}
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`absolute right-16 top-1/2 transform -translate-y-1/2 p-1.5 rounded-full transition-all duration-200 ${
            hasActiveFilters 
              ? 'bg-[#006B53] text-white' 
              : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
          }`}
          title="Advanced filters"
        >
          <Filter className="w-4 h-4" />
        </button>
        
        <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
          <span className="px-3 py-1 bg-gray-200 text-gray-600 text-xs rounded-full font-medium">⌘ F</span>
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
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg p-4 z-50">
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
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg max-h-96 overflow-y-auto z-50">
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
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg max-h-96 overflow-y-auto z-50">
          <div className="p-2">
            <div className="text-xs text-gray-500 px-3 py-2 border-b border-gray-100">
              Found {results.length} results
            </div>
            {results.map((result) => (
              <button
                key={`${result.type}-${result.id}`}
                onClick={() => handleResultClick(result)}
                className="w-full text-left p-3 hover:bg-gray-50 rounded-lg transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-[#006B53] focus:ring-opacity-50"
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
          </div>
        </div>
      )}

      {/* No Results */}
      {showDropdown && !isLoading && results.length === 0 && !aiResponse?.answer && query.trim().length > 2 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg p-4">
          <div className="text-center text-sm text-gray-500">
            {isQuestion(query) 
              ? "Sorry, I couldn't understand your question. Try rephrasing it."
              : `No matches found for "${query}"`
            }
          </div>
        </div>
      )}
    </div>
  );
}
