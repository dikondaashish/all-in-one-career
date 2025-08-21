import { useState, useEffect, useMemo, useCallback } from 'react';
import { debounce } from 'lodash';
import { useAuth } from '@/contexts/AuthContext';

interface RealTimeAnalysis {
  matchScore: number;
  skillsFound: string[];
  missingSkills: string[];
  keywordCount: number;
  totalPossibleKeywords: number;
  isAnalyzing: boolean;
  error?: string;
}

const initialState: RealTimeAnalysis = {
  matchScore: 0,
  skillsFound: [],
  missingSkills: [],
  keywordCount: 0,
  totalPossibleKeywords: 0,
  isAnalyzing: false
};

export const useRealTimeAnalysis = (resumeText: string, jobDescription: string) => {
  const [analysis, setAnalysis] = useState<RealTimeAnalysis>(initialState);
  const { user } = useAuth();

  const analyzeContent = useCallback(async (resume: string, jd: string) => {
    if (!resume?.trim() || !jd?.trim()) {
      setAnalysis(initialState);
      return;
    }

    if (resume.length < 50 || jd.length < 50) {
      setAnalysis(initialState);
      return;
    }

    setAnalysis(prev => ({ ...prev, isAnalyzing: true, error: undefined }));

    try {
      const token = await user?.getIdToken();
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000'}/api/ats/analyze-preview`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          resumeText: resume.trim(), 
          jobDescription: jd.trim() 
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Analysis failed');
      }

      const result = await response.json();
      
      setAnalysis({
        matchScore: result.matchScore || 0,
        skillsFound: result.skillsFound || [],
        missingSkills: result.missingSkills || [],
        keywordCount: result.keywordCount || 0,
        totalPossibleKeywords: result.totalPossibleKeywords || 0,
        isAnalyzing: false
      });

    } catch (error) {
      console.error('Real-time analysis error:', error);
      setAnalysis(prev => ({
        ...prev,
        isAnalyzing: false,
        error: error instanceof Error ? error.message : 'Analysis failed'
      }));
    }
  }, [user]);

  // Debounced analysis function
  const debouncedAnalyze = useMemo(
    () => debounce(analyzeContent, 2000), // 2 second delay
    [analyzeContent]
  );

  useEffect(() => {
    debouncedAnalyze(resumeText, jobDescription);

    // Cleanup function to cancel pending debounced calls
    return () => {
      debouncedAnalyze.cancel();
    };
  }, [resumeText, jobDescription, debouncedAnalyze]);

  // Immediate analysis for when user stops typing
  const triggerImmediateAnalysis = useCallback(() => {
    debouncedAnalyze.cancel();
    analyzeContent(resumeText, jobDescription);
  }, [analyzeContent, resumeText, jobDescription, debouncedAnalyze]);

  return {
    ...analysis,
    triggerImmediateAnalysis
  };
};
