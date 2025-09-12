'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Search, Calendar, Loader2, TrendingUp, Building, Hash, Copy, Edit2, Check, X, Sparkles } from 'lucide-react';
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
  const [newTitle, setNewTitle] = useState('');
  const [generatingTitle, setGeneratingTitle] = useState<string | null>(null);

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
    if (generatingTitle === scanId) return;
    
    try {
      setGeneratingTitle(scanId);
      
      console.log('Debug: Starting AI title generation for scan ID:', scanId);
      console.log('Debug: API Base URL:', API_BASE_URL);

      const authToken = await user?.getIdToken();
      console.log('Debug: Auth token obtained:', !!authToken);

      const url = `${API_BASE_URL}/api/ats/scan/${scanId}/generate-title`;
      console.log('Debug: Full URL:', url);

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
      });

      console.log('Debug: Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Debug: Response error text:', errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      console.log('Debug: Response data:', data);
      
      if (data.success) {
        // Update the scan in the local state
        setScans(prevScans => 
          prevScans.map(scan => 
            scan.id === scanId 
              ? { ...scan, jobTitle: data.title }
              : scan
          )
        );

        // Show appropriate toast based on auto-save status
        if (data.autoSaved) {
          showToast({
            icon: '✅',
            title: 'AI Title Generated & Saved!',
            message: `"${data.title}"${data.fallback ? ' (fallback)' : ''}`
          });
        } else {
          showToast({
            icon: '🤖',
            title: 'AI Title Generated!',
            message: `"${data.title}"${data.fallback ? ' (fallback)' : ''} - ${data.saveError || 'Not auto-saved'}`
          });
        }
        
        // Refresh the scan list to ensure we have the latest data
        if (data.autoSaved) {
          fetchScanHistory();
        }
      } else {
        throw new Error(data.error || 'Failed to generate title');
      }
    } catch (error) {
      console.error('Error generating AI title:', error);
      console.error('Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      });

      let errorMessage = 'Could not generate AI title. Please try again.';
      if (error.message?.includes('Failed to fetch')) {
        errorMessage = 'Network error. Please check your connection and try again.';
      } else if (error.message?.includes('HTTP 401')) {
        errorMessage = 'Authentication failed. Please refresh the page and try again.';
      } else if (error.message?.includes('HTTP 404')) {
        errorMessage = 'Scan not found. Please refresh the page.';
      }

      showToast({
        icon: '❌',
        title: 'Generation Failed',
        message: errorMessage
      });
    } finally {
      setGeneratingTitle(null);
    }
  };

  const startEditingTitle = (scan: ScanHistoryItem) => {
    setEditingTitle(scan.id);
    setNewTitle(scan.jobTitle || '');
  };

  const cancelEditingTitle = () => {
    setEditingTitle(null);
    setNewTitle('');
  };

  const updateScanTitle = async (scanId: string) => {
    if (!newTitle.trim()) {
      showToast({
        icon: '⚠️',
        title: 'Invalid Title',
        message: 'Title cannot be empty'
      });
      return;
    }

    try {
      console.log('Debug: Starting title update for scan ID:', scanId);
      console.log('Debug: New title:', newTitle.trim());
      console.log('Debug: API Base URL:', API_BASE_URL);

      const authToken = await user?.getIdToken();
      console.log('Debug: Auth token obtained:', !!authToken);

      const url = `${API_BASE_URL}/api/ats/scan/${scanId}/title`;
      console.log('Debug: Full URL:', url);

      const requestBody = { title: newTitle.trim() };
      console.log('Debug: Request body:', requestBody);

      const response = await fetch(url, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      console.log('Debug: Response status:', response.status);
      console.log('Debug: Response headers:', response.headers);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Debug: Response error text:', errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      console.log('Debug: Response data:', data);
      
      if (data.success) {
        // Update the scan in the local state
        setScans(prevScans => 
          prevScans.map(scan => 
            scan.id === scanId 
              ? { ...scan, jobTitle: data.title }
              : scan
          )
        );

        setEditingTitle(null);
        setNewTitle('');

        showToast({
          icon: '✅',
          title: 'Title Updated!',
          message: `Updated to: "${data.title}"`
        });
      } else {
        throw new Error(data.error || 'Failed to update title');
      }
    } catch (error) {
      console.error('Error updating title:', error);
      console.error('Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
      
      let errorMessage = 'Could not update title. Please try again.';
      if (error.message?.includes('Failed to fetch')) {
        errorMessage = 'Network error. Please check your connection and try again.';
      } else if (error.message?.includes('HTTP 401')) {
        errorMessage = 'Authentication failed. Please refresh the page and try again.';
      } else if (error.message?.includes('HTTP 404')) {
        errorMessage = 'Scan not found. Please refresh the page.';
      }

      showToast({
        icon: '❌',
        title: 'Update Failed',
        message: errorMessage
      });
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
                        <div className="flex items-center space-x-2">
                          {editingTitle === scan.id ? (
                            // Editing mode
                            <div className="flex items-center space-x-2 flex-1">
                              <input
                                type="text"
                                value={newTitle}
                                onChange={(e) => setNewTitle(e.target.value)}
                                className="flex-1 px-2 py-1 border border-blue-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Enter job title..."
                                autoFocus
                                onKeyPress={(e) => {
                                  if (e.key === 'Enter') {
                                    updateScanTitle(scan.id);
                                  } else if (e.key === 'Escape') {
                                    cancelEditingTitle();
                                  }
                                }}
                              />
                              <button
                                onClick={() => updateScanTitle(scan.id)}
                                className="p-1 text-green-600 hover:bg-green-50 rounded transition-colors"
                                title="Save title"
                              >
                                <Check className="w-4 h-4" />
                              </button>
                              <button
                                onClick={cancelEditingTitle}
                                className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                                title="Cancel editing"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          ) : (
                            // Display mode
                            <>
                              <div className="flex items-center space-x-2 flex-1">
                                {scan.jobTitle ? (
                                  <span className="font-medium text-gray-900">{scan.jobTitle}</span>
                                ) : (
                                  <span className="text-gray-400 italic">No title</span>
                                )}
                                
                                {/* Edit and AI Generate buttons */}
                                <div className="flex items-center space-x-1">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      startEditingTitle(scan);
                                    }}
                                    className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
                                    title="Edit title"
                                  >
                                    <Edit2 className="w-3 h-3" />
                                  </button>
                                  
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      generateAITitle(scan.id);
                                    }}
                                    disabled={generatingTitle === scan.id}
                                    className="p-1 text-purple-400 hover:text-purple-600 hover:bg-purple-50 rounded transition-colors disabled:opacity-50"
                                    title="Generate AI title"
                                  >
                                    {generatingTitle === scan.id ? (
                                      <Loader2 className="w-3 h-3 animate-spin" />
                                    ) : (
                                      <Sparkles className="w-3 h-3" />
                                    )}
                                  </button>
                                </div>
                              </div>
                              
                              {scan.companyName && (
                                <>
                                  <span className="text-gray-400">•</span>
                                  <div className="flex items-center text-gray-600">
                                    <Building className="w-4 h-4 mr-1" />
                                    <span>{scan.companyName}</span>
                                  </div>
                                </>
                              )}
                            </>
                          )}
                        </div>
                        
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
