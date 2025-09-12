'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Search, Calendar, Loader2, TrendingUp, Building, Hash, Copy, Edit3, Sparkles, Check, X } from 'lucide-react';
import { useToast } from '../../../../components/notifications/ToastContainer';
import { useAuth } from '@/contexts/AuthContext';

interface ScanHistoryItem {
  id: string;
  jobTitle?: string;
  companyName?: string;
  overallScore: number;
  matchRate: number;
  createdAt: string;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://all-in-one-career.onrender.com';

const ScanHistoryPage: React.FC = () => {
  const router = useRouter();
  const { showToast } = useToast();
  const { user } = useAuth();
  const [scans, setScans] = useState<ScanHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingTitle, setEditingTitle] = useState<string | null>(null);
  const [editedTitle, setEditedTitle] = useState('');
  const [generatingTitles, setGeneratingTitles] = useState<Set<string>>(new Set());
  const [savingTitle, setSavingTitle] = useState(false);

  useEffect(() => {
    // Only fetch when user is available
    if (user) {
      fetchScanHistory();
    } else {
      // If no user, show empty state
      setLoading(false);
    }
  }, [user]);

  const fetchScanHistory = async () => {
    try {
      console.log('Fetching scan history...', { user: !!user, apiUrl: API_BASE_URL });
      
      // Get Firebase ID token for authentication
      let authToken = '';
      if (user) {
        try {
          authToken = await user.getIdToken();
          console.log('Firebase token obtained successfully');
        } catch (tokenError) {
          console.error('Failed to get Firebase ID token:', tokenError);
          throw new Error('Authentication failed. Please log in again.');
        }
      } else {
        throw new Error('No user authentication available');
      }

      const url = `${API_BASE_URL}/api/ats/history?limit=20`;
      console.log('Making request to:', url);

      let response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
      });
      
      console.log('API Response:', { status: response.status, ok: response.ok });
      
      // If unauthorized, try refreshing the token once
      if (response.status === 401 && user) {
        console.log('Token expired, refreshing...');
        try {
          const freshToken = await user.getIdToken(true); // Force refresh
          response = await fetch(url, {
            headers: {
              'Authorization': `Bearer ${freshToken}`,
              'Content-Type': 'application/json',
            },
          });
          console.log('Retry API Response:', { status: response.status, ok: response.ok });
        } catch (refreshError) {
          console.error('Token refresh failed:', refreshError);
        }
      }
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error:', { status: response.status, body: errorText });
        
        if (response.status === 401) {
          throw new Error('Authentication failed. Please log in again.');
        } else if (response.status === 404) {
          throw new Error('History endpoint not found. This might be a deployment issue.');
        } else {
          throw new Error(`Failed to fetch scan history: ${response.status} ${errorText}`);
        }
      }
      
      const data = await response.json();
      console.log('Scan history data received:', { count: data.length, data });
      setScans(data);
    } catch (error) {
      console.error('Failed to fetch scan history:', error);
      showToast({ 
        icon: '❌', 
        title: 'Error', 
        message: `Failed to load scan history: ${error instanceof Error ? error.message : 'Unknown error'}` 
      });
      // Set empty scans array so the empty state shows
      setScans([]);
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-100';
    if (score >= 60) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text).then(() => {
      showToast({
        icon: '📋',
        title: 'Copied!',
        message: `${label} copied to clipboard`
      });
    }).catch(() => {
      showToast({
        icon: '❌',
        title: 'Failed to copy',
        message: 'Could not copy to clipboard'
      });
    });
  };

  const generateAITitle = async (scanId: string) => {
    if (!user || generatingTitles.has(scanId)) return;

    try {
      setGeneratingTitles(prev => new Set([...prev, scanId]));

      const authToken = await user.getIdToken();
      const response = await fetch(`${API_BASE_URL}/api/ats/scan/${scanId}/generate-title`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to generate title');
      }

      const data = await response.json();
      
      // Update the scan in the local state
      setScans(prevScans => 
        prevScans.map(scan => 
          scan.id === scanId 
            ? { ...scan, jobTitle: data.title }
            : scan
        )
      );

      showToast({
        icon: '✨',
        title: 'AI Title Generated',
        message: data.fallback ? 'Fallback title created' : 'Smart title generated!'
      });

    } catch (error) {
      console.error('Failed to generate AI title:', error);
      showToast({
        icon: '❌',
        title: 'Generation Failed',
        message: 'Could not generate title. Please try again.'
      });
    } finally {
      setGeneratingTitles(prev => {
        const newSet = new Set(prev);
        newSet.delete(scanId);
        return newSet;
      });
    }
  };

  const startEditingTitle = (scanId: string, currentTitle: string) => {
    setEditingTitle(scanId);
    setEditedTitle(currentTitle);
  };

  const cancelEditingTitle = () => {
    setEditingTitle(null);
    setEditedTitle('');
  };

  const saveTitle = async (scanId: string) => {
    if (!user || !editedTitle.trim() || savingTitle) return;

    try {
      setSavingTitle(true);

      const authToken = await user.getIdToken();
      const response = await fetch(`${API_BASE_URL}/api/ats/scan/${scanId}/title`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title: editedTitle.trim() }),
      });

      if (!response.ok) {
        throw new Error('Failed to update title');
      }

      const data = await response.json();
      
      // Update the scan in the local state
      setScans(prevScans => 
        prevScans.map(scan => 
          scan.id === scanId 
            ? { ...scan, jobTitle: data.title }
            : scan
        )
      );

      setEditingTitle(null);
      setEditedTitle('');

      showToast({
        icon: '✅',
        title: 'Title Updated',
        message: 'Scan title saved successfully!'
      });

    } catch (error) {
      console.error('Failed to save title:', error);
      showToast({
        icon: '❌',
        title: 'Save Failed',
        message: 'Could not save title. Please try again.'
      });
    } finally {
      setSavingTitle(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto h-12 w-12 text-blue-600 animate-spin" />
          <p className="mt-4 text-gray-600">Loading scan history...</p>
          <p className="mt-2 text-sm text-gray-400">Authenticating and fetching your data...</p>
        </div>
      </div>
    );
  }

  // If user is not authenticated, show login prompt
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Search className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-4 text-lg font-medium text-gray-900">Authentication Required</h3>
          <p className="mt-2 text-gray-600">
            Please log in to view your scan history.
          </p>
          <button
            onClick={() => router.push('/ats-scanner')}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Go to Scanner
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => router.push('/ats-scanner')}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-800"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Back to Scanner</span>
            </button>
            <div className="border-l border-gray-300 pl-4">
              <h1 className="text-xl font-semibold text-gray-900">Scan History</h1>
              <p className="text-sm text-gray-500">
                {scans.length} scan{scans.length !== 1 ? 's' : ''} completed
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {scans.length === 0 ? (
          <div className="text-center py-12">
            <Search className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-4 text-lg font-medium text-gray-900">No scan history</h3>
            <p className="mt-2 text-gray-600">
              You haven't run any ATS scans yet. Start by uploading your resume and a job description.
            </p>
            <button
              onClick={() => router.push('/ats-scanner')}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Run Your First Scan
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {scans.map((scan) => (
              <div 
                key={scan.id} 
                className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => router.push(`/ats-scanner/results/${scan.id}`)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-4">
                      {/* Scores */}
                      <div className="flex space-x-3">
                        <div className={`px-3 py-1 rounded-full text-sm font-medium ${getScoreColor(scan.overallScore)}`}>
                          {scan.overallScore}% Overall
                        </div>
                        <div className={`px-3 py-1 rounded-full text-sm font-medium ${getScoreColor(scan.matchRate)}`}>
                          {scan.matchRate}% Match
                        </div>
                      </div>
                      
                      {/* Job Info */}
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          {/* Title Display/Edit */}
                          {editingTitle === scan.id ? (
                            <div className="flex items-center space-x-2 flex-1">
                              <input
                                type="text"
                                value={editedTitle}
                                onChange={(e) => setEditedTitle(e.target.value)}
                                className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Enter job title..."
                                maxLength={100}
                                onClick={(e) => e.stopPropagation()}
                                onKeyPress={(e) => {
                                  if (e.key === 'Enter') {
                                    saveTitle(scan.id);
                                  } else if (e.key === 'Escape') {
                                    cancelEditingTitle();
                                  }
                                }}
                              />
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  saveTitle(scan.id);
                                }}
                                disabled={!editedTitle.trim() || savingTitle}
                                className="p-1 text-green-600 hover:bg-green-100 rounded transition-colors disabled:opacity-50"
                                title="Save title"
                              >
                                {savingTitle ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <Check className="w-4 h-4" />
                                )}
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  cancelEditingTitle();
                                }}
                                className="p-1 text-gray-500 hover:bg-gray-100 rounded transition-colors"
                                title="Cancel editing"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center space-x-2 flex-1">
                              <span className="font-medium text-gray-900 flex-1">
                                {scan.jobTitle || 'Untitled Scan'}
                              </span>
                              
                              {/* AI Generate Title Button */}
                              {(!scan.jobTitle || scan.jobTitle === 'Enhanced AI Scan' || scan.jobTitle === 'Advanced Scan') && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    generateAITitle(scan.id);
                                  }}
                                  disabled={generatingTitles.has(scan.id)}
                                  className="p-1 text-purple-600 hover:bg-purple-100 rounded transition-colors disabled:opacity-50"
                                  title="Generate AI title"
                                >
                                  {generatingTitles.has(scan.id) ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                  ) : (
                                    <Sparkles className="w-4 h-4" />
                                  )}
                                </button>
                              )}
                              
                              {/* Edit Title Button */}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  startEditingTitle(scan.id, scan.jobTitle || '');
                                }}
                                className="p-1 text-gray-500 hover:bg-gray-100 rounded transition-colors"
                                title="Edit title"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                            </div>
                          )}
                        </div>
                        
                        {/* Company Name */}
                        {scan.companyName && (
                          <div className="flex items-center text-gray-600 mb-1">
                            <Building className="w-4 h-4 mr-1" />
                            <span>{scan.companyName}</span>
                          </div>
                        )}
                        
                        <div className="flex items-center justify-between mt-2">
                          <div className="flex items-center text-sm text-gray-500">
                            <Calendar className="w-4 h-4 mr-1" />
                            <span>{new Date(scan.createdAt).toLocaleDateString()}</span>
                            <span className="mx-2">•</span>
                            <span>{new Date(scan.createdAt).toLocaleTimeString()}</span>
                          </div>
                          
                          {/* Scan ID Display */}
                          <div className="flex items-center space-x-2">
                            <div className="flex items-center space-x-1 px-2 py-1 bg-gray-50 rounded-md">
                              <Hash className="w-3 h-3 text-gray-400" />
                              <span className="text-xs font-mono text-gray-600">
                                {scan.id.slice(0, 8)}...
                              </span>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  copyToClipboard(scan.id, 'Scan ID');
                                }}
                                className="p-0.5 hover:bg-gray-200 rounded transition-colors"
                                title="Copy full scan ID"
                              >
                                <Copy className="w-3 h-3 text-gray-400 hover:text-gray-600" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* View Button */}
                  <div className="flex items-center">
                    <button className="flex items-center space-x-2 px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                      <TrendingUp className="w-4 h-4" />
                      <span>View Results</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ScanHistoryPage;
