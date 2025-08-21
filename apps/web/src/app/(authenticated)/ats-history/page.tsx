'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { Calendar, FileText, TrendingUp, Trash2, Eye, Plus, Search } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { formatDistanceToNow } from 'date-fns';

export const dynamic = 'force-dynamic';

interface AtsScanHistoryItem {
  id: string;
  fileName: string;
  matchScore: number;
  createdAt: string;
  hasJobDescription: boolean;
  missingSkills: string[];
  extraSkills: string[];
  parsedJson: {
    name?: string;
    email?: string;
    skills?: string[];
  };
}

const fetcher = async (url: string) => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Failed to fetch scan history');
  }
  return response.json();
};

const ScanHistory = () => {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'score'>('date');
  const [filterScore, setFilterScore] = useState<'all' | 'excellent' | 'good' | 'needs-work'>('all');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  const { data: response, error, mutate } = useSWR(
    user ? '/api/ats/scans?limit=50' : null,
    fetcher,
    {
      refreshInterval: 30000, // Refresh every 30 seconds
      revalidateOnFocus: true
    }
  );

  const scans: AtsScanHistoryItem[] = response?.scans || [];
  const total = response?.total || 0;

  const deleteScan = async (scanId: string) => {
    try {
      const response = await fetch(`/api/ats/scans/${scanId}`, { 
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${await user?.getIdToken()}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to delete scan');
      }

      mutate(); // Refresh the list
      setShowDeleteConfirm(null);
    } catch (error) {
      console.error('Delete scan error:', error);
      alert('Failed to delete scan. Please try again.');
    }
  };

  // Filter and sort scans
  const filteredScans = scans
    .filter(scan => {
      // Search filter
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const matchesFileName = scan.fileName.toLowerCase().includes(searchLower);
        const matchesName = scan.parsedJson.name?.toLowerCase().includes(searchLower);
        const matchesEmail = scan.parsedJson.email?.toLowerCase().includes(searchLower);
        
        if (!matchesFileName && !matchesName && !matchesEmail) {
          return false;
        }
      }

      // Score filter
      if (filterScore !== 'all') {
        if (filterScore === 'excellent' && scan.matchScore < 80) return false;
        if (filterScore === 'good' && (scan.matchScore < 60 || scan.matchScore >= 80)) return false;
        if (filterScore === 'needs-work' && scan.matchScore >= 60) return false;
      }

      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'score') {
        return b.matchScore - a.matchScore;
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 dark:text-green-400';
    if (score >= 60) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getScoreBackground = (score: number) => {
    if (score >= 80) return 'bg-green-100 dark:bg-green-900/20';
    if (score >= 60) return 'bg-yellow-100 dark:bg-yellow-900/20';
    return 'bg-red-100 dark:bg-red-900/20';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    return 'Needs Work';
  };

  if (error) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="text-center py-12">
          <div className="text-red-500 mb-4">⚠️</div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Failed to load scan history
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Please try refreshing the page or contact support if the problem persists.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Scan History</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {total > 0 ? `${total} total scans` : 'No scans yet'}
          </p>
        </div>
        <Link 
          href="/ats-scanner"
          className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>New Scan</span>
        </Link>
      </div>

      {scans.length > 0 && (
        <>
          {/* Filters and Search */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Search */}
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by filename, name, or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>

              {/* Sort */}
              <div>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as 'date' | 'score')}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                >
                  <option value="date">Sort by Date</option>
                  <option value="score">Sort by Score</option>
                </select>
              </div>

              {/* Filter by Score */}
              <div>
                <select
                  value={filterScore}
                  onChange={(e) => setFilterScore(e.target.value as typeof filterScore)}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                >
                  <option value="all">All Scores</option>
                  <option value="excellent">Excellent (80%+)</option>
                  <option value="good">Good (60-79%)</option>
                  <option value="needs-work">Needs Work (&lt;60%)</option>
                </select>
              </div>
            </div>

            {filteredScans.length !== scans.length && (
              <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
                Showing {filteredScans.length} of {scans.length} scans
              </div>
            )}
          </div>
        </>
      )}

      {/* Scan List */}
      {filteredScans.length === 0 ? (
        <div className="text-center py-12">
          {scans.length === 0 ? (
            <>
              <FileText className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No scans yet
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Upload your first resume to start analyzing it with our ATS scanner.
              </p>
              <Link 
                href="/ats-scanner"
                className="inline-flex items-center space-x-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Start Your First Scan</span>
              </Link>
            </>
          ) : (
            <>
              <Search className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No scans match your filters
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Try adjusting your search or filter criteria.
              </p>
            </>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredScans.map(scan => (
            <div key={scan.id} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  {/* Score and Date */}
                  <div className="flex items-center space-x-4 mb-3">
                    <div className={`flex items-center space-x-2 px-3 py-1 rounded-full ${getScoreBackground(scan.matchScore)}`}>
                      <div className={`w-2 h-2 rounded-full ${scan.matchScore >= 80 ? 'bg-green-500' : scan.matchScore >= 60 ? 'bg-yellow-500' : 'bg-red-500'}`} />
                      <span className={`font-semibold ${getScoreColor(scan.matchScore)}`}>
                        {scan.matchScore}%
                      </span>
                      <span className={`text-xs ${getScoreColor(scan.matchScore)}`}>
                        {getScoreLabel(scan.matchScore)}
                      </span>
                    </div>
                    
                    <span className="text-gray-500 dark:text-gray-400 text-sm flex items-center">
                      <Calendar className="w-4 h-4 mr-1" />
                      {formatDistanceToNow(new Date(scan.createdAt), { addSuffix: true })}
                    </span>

                    {scan.hasJobDescription && (
                      <span className="text-xs bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 px-2 py-1 rounded">
                        With Job Description
                      </span>
                    )}
                  </div>
                  
                  {/* File and Candidate Info */}
                  <div className="mb-3">
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                      {scan.fileName}
                    </h3>
                    {scan.parsedJson.name && (
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Candidate: {scan.parsedJson.name}
                        {scan.parsedJson.email && ` • ${scan.parsedJson.email}`}
                      </p>
                    )}
                  </div>

                  {/* Skills Summary */}
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    <div className="flex flex-wrap gap-4">
                      <span>
                        <TrendingUp className="w-4 h-4 inline mr-1" />
                        {scan.parsedJson.skills?.length || 0} skills detected
                      </span>
                      {scan.missingSkills?.length > 0 && (
                        <span className="text-orange-600 dark:text-orange-400">
                          {scan.missingSkills.length} missing skills
                        </span>
                      )}
                      {scan.extraSkills?.length > 0 && (
                        <span className="text-green-600 dark:text-green-400">
                          {scan.extraSkills.length} extra skills
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Actions */}
                <div className="flex items-center space-x-2 ml-4">
                  <Link
                    href={`/ats-scan-report/${scan.id}`}
                    className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                    title="View detailed report"
                  >
                    <Eye className="w-4 h-4" />
                  </Link>
                  <button
                    onClick={() => setShowDeleteConfirm(scan.id)}
                    className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                    title="Delete scan"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Delete Scan
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Are you sure you want to delete this scan? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => deleteScan(showDeleteConfirm)}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ScanHistory;
