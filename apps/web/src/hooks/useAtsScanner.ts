'use client';

import { useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import useSWR, { mutate } from 'swr';

// Interface for scan result response
export interface AtsScanResult {
  scanId: string;
  matchScore: number;
  summary: {
    name: string;
    email: string;
    phone: string;
    skills: string[];
  };
  missingSkills: string[];
  extraSkills: string[];
  keywords: AtsKeywordStat[];
}

// Interface for scan history item
export interface AtsScanHistoryItem {
  id: string;
  fileName: string;
  matchScore: number;
  createdAt: string;
  fileType: string;
  hasJobDescription: boolean;
}

// Interface for detailed scan data
export interface AtsScanDetail {
  id: string;
  fileName: string;
  fileType: string;
  jdText: string | null;
  parsedJson: {
    name: string;
    email: string;
    phone: string;
    education: Array<{
      degree: string;
      school: string;
      year: string;
    }>;
    experience: Array<{
      title: string;
      company: string;
      startYear: string;
      endYear: string;
      description: string;
    }>;
    skills: string[];
    originalText: string;
  };
  matchScore: number;
  missingSkills: string[];
  extraSkills: string[];
  createdAt: string;
  keywords: AtsKeywordStat[];
}

// Interface for keyword statistics
export interface AtsKeywordStat {
  keyword: string;
  inResume: boolean;
  inJobDesc: boolean;
  weight: number;
}

// Interface for history response
export interface AtsHistoryResponse {
  scans: AtsScanHistoryItem[];
  total: number;
  limit: number;
  offset: number;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export const useAtsScanner = () => {
  const { user } = useAuth();
  const [isScanning, setIsScanning] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);

  // SWR fetcher with authentication
  const fetcher = useCallback(async (url: string) => {
    if (!user) throw new Error('User not authenticated');
    const token = await user.getIdToken();
    const res = await fetch(url, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.error || 'Failed to fetch data');
    }
    return res.json();
  }, [user]);

  // Function to scan a resume
  const scanResume = useCallback(async (file: File, jobDescription?: string): Promise<AtsScanResult> => {
    if (!user) throw new Error('Authentication required to scan resume.');

    setIsScanning(true);
    try {
      const token = await user.getIdToken();
      const formData = new FormData();
      formData.append('resume', file);
      if (jobDescription) {
        formData.append('jobDescription', jobDescription);
      }

      const response = await fetch(`${API_BASE_URL}/api/ats/scan`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to scan resume');
      }

      const result: AtsScanResult = await response.json();
      
      // Invalidate history cache to refresh the list
      mutate(`${API_BASE_URL}/api/ats/scans`);
      
      return result;
    } finally {
      setIsScanning(false);
    }
  }, [user]);

  // Function to get ATS scan history
  const getAtsHistory = useCallback(async (limit: number = 20, offset: number = 0): Promise<AtsHistoryResponse> => {
    if (!user) return { scans: [], total: 0, limit, offset };

    setIsLoadingHistory(true);
    try {
      const token = await user.getIdToken();
      const response = await fetch(`${API_BASE_URL}/api/ats/scans?limit=${limit}&offset=${offset}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch ATS history');
      }

      return response.json();
    } finally {
      setIsLoadingHistory(false);
    }
  }, [user]);

  // Function to get detailed scan data
  const getScanDetail = useCallback(async (scanId: string): Promise<AtsScanDetail> => {
    if (!user) throw new Error('Authentication required to view scan details.');

    setIsLoadingDetail(true);
    try {
      const token = await user.getIdToken();
      const response = await fetch(`${API_BASE_URL}/api/ats/scans/${scanId}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch scan details');
      }

      return response.json();
    } finally {
      setIsLoadingDetail(false);
    }
  }, [user]);

  // Function to delete a scan
  const deleteScan = useCallback(async (scanId: string) => {
    if (!user) throw new Error('Authentication required to delete scan.');

    try {
      const token = await user.getIdToken();
      const response = await fetch(`${API_BASE_URL}/api/ats/scans/${scanId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete scan');
      }

      // Invalidate history cache to refresh the list
      mutate(`${API_BASE_URL}/api/ats/scans`);
    } catch (error) {
      console.error('Error deleting scan:', error);
      throw error;
    }
  }, [user]);

  // Hook for scan history using SWR
  const useAtsHistory = (limit: number = 20, offset: number = 0) => {
    const { data, error, isLoading } = useSWR<AtsHistoryResponse>(
      user ? `${API_BASE_URL}/api/ats/scans?limit=${limit}&offset=${offset}` : null,
      fetcher,
      {
        refreshInterval: 0, // Don't auto-refresh
        revalidateOnFocus: false,
      }
    );

    return {
      data,
      error,
      isLoading,
    };
  };

  return {
    scanResume,
    getAtsHistory,
    getScanDetail,
    deleteScan,
    useAtsHistory,
    isScanning,
    isLoadingHistory,
    isLoadingDetail,
  };
};

// Named export for the hook function
export { useAtsScanner as default };