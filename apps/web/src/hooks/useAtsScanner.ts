import { useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://all-in-one-career-api.onrender.com';

export interface AtsScanResult {
  scanId: string;
  matchScore: number;
  summary: {
    name: string | null;
    email: string | null;
    phone: string | null;
    skills: string[];
  };
  missingSkills: string[];
  extraSkills: string[];
  keywords: Array<{
    keyword: string;
    inResume: boolean;
    inJobDesc: boolean;
    weight: number;
  }>;
}

export interface AtsScanHistoryItem {
  id: string;
  fileName: string;
  matchScore: number;
  createdAt: string;
  fileType: string;
}

export interface AtsScanDetail {
  id: string;
  userId: string;
  fileName: string;
  fileType: string;
  jdText: string | null;
  parsedJson: {
    name: string | null;
    email: string | null;
    phone: string | null;
    skills: string[];
    education: Array<{
      school: string;
      degree: string;
      year: string | null;
    }>;
    experience: Array<{
      title: string;
      company: string;
      start: string;
      end: string | null;
      bullets: string[];
    }>;
  };
  matchScore: number;
  missingSkills: string[];
  extraSkills: string[];
  createdAt: string;
  keywords: Array<{
    id: string;
    keyword: string;
    inResume: boolean;
    inJobDesc: boolean;
    weight: number;
  }>;
}

export interface AtsHistory {
  scans: AtsScanHistoryItem[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

export function useAtsScanner() {
  const [isScanning, setIsScanning] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const { user } = useAuth();

  const scanResume = useCallback(async (
    file: File, 
    jobDescription?: string
  ): Promise<AtsScanResult> => {
    if (!user) {
      throw new Error('Authentication required');
    }

    setIsScanning(true);
    
    try {
      const formData = new FormData();
      formData.append('resume', file);
      if (jobDescription) {
        formData.append('jobDescription', jobDescription);
      }

      const token = await user.getIdToken();
      
      const response = await fetch(`${API_BASE_URL}/api/ats/scan`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Scan failed with status ${response.status}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Resume scan error:', error);
      throw error;
    } finally {
      setIsScanning(false);
    }
  }, [user]);

  const getAtsHistory = useCallback(async (
    limit: number = 20, 
    offset: number = 0
  ): Promise<AtsHistory> => {
    if (!user) {
      throw new Error('Authentication required');
    }

    setIsLoadingHistory(true);
    
    try {
      const token = await user.getIdToken();
      
      const response = await fetch(
        `${API_BASE_URL}/api/ats/scans?limit=${limit}&offset=${offset}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to fetch history with status ${response.status}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('ATS history fetch error:', error);
      throw error;
    } finally {
      setIsLoadingHistory(false);
    }
  }, [user]);

  const getScanDetail = useCallback(async (scanId: string): Promise<AtsScanDetail> => {
    if (!user) {
      throw new Error('Authentication required');
    }

    setIsLoadingDetail(true);
    
    try {
      const token = await user.getIdToken();
      
      const response = await fetch(`${API_BASE_URL}/api/ats/scans/${scanId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to fetch scan detail with status ${response.status}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('ATS scan detail fetch error:', error);
      throw error;
    } finally {
      setIsLoadingDetail(false);
    }
  }, [user]);

  const deleteScan = useCallback(async (scanId: string): Promise<void> => {
    if (!user) {
      throw new Error('Authentication required');
    }
    
    try {
      const token = await user.getIdToken();
      
      const response = await fetch(`${API_BASE_URL}/api/ats/scans/${scanId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to delete scan with status ${response.status}`);
      }
    } catch (error) {
      console.error('ATS scan delete error:', error);
      throw error;
    }
  }, [user]);

  return {
    scanResume,
    getAtsHistory,
    getScanDetail,
    deleteScan,
    isScanning,
    isLoadingHistory,
    isLoadingDetail,
  };
}
