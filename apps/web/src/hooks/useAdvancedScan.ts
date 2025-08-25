import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://all-in-one-career.onrender.com';

interface AdvancedScanRequest {
  resumeText: string;
  jobDescription: string;
  jobUrl?: string;
  fileMeta?: {
    name: string;
    type: string;
  };
}

interface AdvancedScanResponse {
  scanId: string;
  overallScore: number;
  percentile: number;
  breakdown: {
    atsCompatibility: number;
    skillMatch: number;
    recruiterPsychology: number;
    marketAlignment: number;
    predictions: number;
  };
  strengths: string[];
  weaknesses: string[];
  atsCompatibility: any;
  jobTitleMatch: any;
  skills: any;
  recruiterPsych: any;
  marketIntel: any;
  industryIntel: any;
  companyFit?: any;
  predictions: any;
  strategy: any;
  wordStats: any;
  webPresence: any;
  interviewPrep: any;
  negotiationStrategy: any;
  processingTime: number;
}

interface ScanProgress {
  step: number;
  message: string;
  completed: boolean;
}

const SCAN_STEPS = [
  'Parsing resume and job description...',
  'Running ATS compatibility checks...',
  'Extracting skill intelligence...',
  'Analyzing market & industry trends...',
  'Evaluating company fit...',
  'Generating hire predictions...',
  'Creating strategic recommendations...',
  'Finalizing comprehensive report...'
];

export function useAdvancedScan() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState<ScanProgress>({ step: 0, message: '', completed: false });
  const [result, setResult] = useState<AdvancedScanResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const startScan = async (scanRequest: AdvancedScanRequest): Promise<string | null> => {
    if (!user) {
      setError('Authentication required');
      return null;
    }

    setIsLoading(true);
    setError(null);
    setResult(null);
    setProgress({ step: 0, message: SCAN_STEPS[0], completed: false });

    try {
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          const nextStep = Math.min(prev.step + 1, SCAN_STEPS.length - 1);
          return {
            step: nextStep,
            message: SCAN_STEPS[nextStep],
            completed: false
          };
        });
      }, 1500); // Update every 1.5 seconds

      const authToken = await user.getIdToken();

      const response = await fetch(`${API_BASE_URL}/api/ats/advanced-scan`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify(scanRequest),
      });

      clearInterval(progressInterval);

      // Handle token expiration
      if (response.status === 401) {
        const freshToken = await user.getIdToken(true);
        
        const retryResponse = await fetch(`${API_BASE_URL}/api/ats/advanced-scan`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${freshToken}`,
          },
          body: JSON.stringify(scanRequest),
        });

        if (!retryResponse.ok) {
          const errorData = await retryResponse.json();
          throw new Error(errorData.message || 'Advanced scan failed after token refresh');
        }

        const retryResult = await retryResponse.json();
        setResult(retryResult);
        setProgress({ step: SCAN_STEPS.length - 1, message: 'Analysis complete!', completed: true });
        return retryResult.scanId;
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Advanced scan failed with status ${response.status}`);
      }

      const scanResult = await response.json();
      setResult(scanResult);
      setProgress({ step: SCAN_STEPS.length - 1, message: 'Analysis complete!', completed: true });
      
      return scanResult.scanId;

    } catch (err: any) {
      console.error('Advanced scan error:', err);
      setError(err.message || 'Advanced scan failed. Please try again.');
      setProgress({ step: 0, message: 'Scan failed', completed: false });
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const reset = () => {
    setIsLoading(false);
    setProgress({ step: 0, message: '', completed: false });
    setResult(null);
    setError(null);
  };

  return {
    startScan,
    isLoading,
    progress,
    result,
    error,
    reset,
  };
}

export type { AdvancedScanRequest, AdvancedScanResponse, ScanProgress };
