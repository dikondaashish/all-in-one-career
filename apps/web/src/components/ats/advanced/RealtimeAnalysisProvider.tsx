'use client';

import React, { createContext, useContext } from 'react';

interface RealtimeAnalysisContextType {
  realtimeEnabled: boolean;
  setRealtimeEnabled: (enabled: boolean) => void;
}

const RealtimeAnalysisContext = createContext<RealtimeAnalysisContextType | undefined>(undefined);

interface RealtimeAnalysisProviderProps {
  children: React.ReactNode;
  value: RealtimeAnalysisContextType;
}

export const RealtimeAnalysisProvider: React.FC<RealtimeAnalysisProviderProps> = ({ 
  children, 
  value 
}) => {
  return (
    <RealtimeAnalysisContext.Provider value={value}>
      {children}
    </RealtimeAnalysisContext.Provider>
  );
};

export const useRealtimeAnalysis = () => {
  const context = useContext(RealtimeAnalysisContext);
  if (context === undefined) {
    throw new Error('useRealtimeAnalysis must be used within a RealtimeAnalysisProvider');
  }
  return context;
};

export default RealtimeAnalysisProvider;
