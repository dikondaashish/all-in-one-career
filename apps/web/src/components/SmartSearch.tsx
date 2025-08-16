'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Search, FileText, Briefcase, Mail, Users, Building, Calendar } from 'lucide-react';

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
  results: SearchResult[];
  totalResults: number;
}

export default function SmartSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (query.trim().length > 2) {
        performSearch(query.trim());
      } else {
        setResults([]);
        setShowDropdown(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const performSearch = async (searchQuery: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/search?query=${encodeURIComponent(searchQuery)}`);
      
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

  const handleResultClick = (result: SearchResult) => {
    setShowDropdown(false);
    setQuery('');
    router.push(result.link);
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

  return (
    <div className="relative" ref={searchRef}>
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        <input
          ref={inputRef}
          type="text"
          placeholder="Search applications, portfolios, emails..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => {
            if (results.length > 0) setShowDropdown(true);
          }}
          className="w-full pl-12 pr-20 py-3 bg-gray-50 border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-[#006B53] focus:border-transparent text-sm transition-all duration-200"
        />
        <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
          <span className="px-3 py-1 bg-gray-200 text-gray-600 text-xs rounded-full font-medium">⌘ F</span>
        </div>
      </div>

      {/* Loading Indicator */}
      {isLoading && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg p-4">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#006B53]"></div>
            <span className="ml-2 text-sm text-gray-600">Searching...</span>
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

      {/* Search Results Dropdown */}
      {showDropdown && results.length > 0 && (
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
      {showDropdown && !isLoading && results.length === 0 && query.trim().length > 2 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg p-4">
          <div className="text-center text-sm text-gray-500">
            No matches found for &quot;{query}&quot;
          </div>
        </div>
      )}
    </div>
  );
}
