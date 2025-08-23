'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Search, Calendar, Loader2, TrendingUp, Building } from 'lucide-react';
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

  useEffect(() => {
    fetchScanHistory();
  }, []);

  const fetchScanHistory = async () => {
    try {
      // Get Firebase ID token for authentication
      let authToken = '';
      if (user) {
        try {
          authToken = await user.getIdToken();
        } catch (tokenError) {
          console.error('Failed to get Firebase ID token:', tokenError);
          throw new Error('Authentication failed. Please log in again.');
        }
      } else {
        throw new Error('No user authentication available');
      }

      let response = await fetch(`${API_BASE_URL}/api/ats/history?limit=20`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch scan history');
      }
      
      const data = await response.json();
      setScans(data);
    } catch (error) {
      console.error('Failed to fetch scan history:', error);
      showToast({ 
        icon: '❌', 
        title: 'Error', 
        message: 'Failed to load scan history' 
      });
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-100';
    if (score >= 60) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto h-12 w-12 text-blue-600 animate-spin" />
          <p className="mt-4 text-gray-600">Loading scan history...</p>
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
                          {scan.jobTitle && (
                            <span className="font-medium text-gray-900">{scan.jobTitle}</span>
                          )}
                          {scan.companyName && (
                            <>
                              <span className="text-gray-400">•</span>
                              <div className="flex items-center text-gray-600">
                                <Building className="w-4 h-4 mr-1" />
                                <span>{scan.companyName}</span>
                              </div>
                            </>
                          )}
                        </div>
                        
                        <div className="flex items-center text-sm text-gray-500 mt-1">
                          <Calendar className="w-4 h-4 mr-1" />
                          <span>{new Date(scan.createdAt).toLocaleDateString()}</span>
                          <span className="mx-2">•</span>
                          <span>{new Date(scan.createdAt).toLocaleTimeString()}</span>
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
