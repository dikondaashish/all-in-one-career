/**
 * Print Button Component - Opens print preview page
 */

import React from 'react';
import { Printer } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface PrintButtonProps {
  scanId: string;
}

export const PrintButton: React.FC<PrintButtonProps> = ({ scanId }) => {
  const router = useRouter();

  const handlePrint = () => {
    // Open print page in new window
    const printUrl = `/ats-report-print?scanId=${scanId}`;
    window.open(printUrl, '_blank', 'width=1200,height=800,scrollbars=yes,resizable=yes');
  };

  return (
    <button
      onClick={handlePrint}
      className="group relative overflow-hidden bg-gradient-to-r from-green-500 via-green-600 to-emerald-600 hover:from-green-600 hover:via-emerald-600 hover:to-emerald-700 text-white font-semibold py-3 px-6 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 ease-out border border-green-500/20"
    >
      {/* Animated Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-r from-green-400/20 to-emerald-600/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      
      {/* Shimmer Effect */}
      <div className="absolute inset-0 -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
      
      {/* Content */}
      <div className="relative flex items-center space-x-3">
        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-white/10 group-hover:bg-white/20 transition-colors duration-300">
          <Printer className="w-5 h-5 text-white group-hover:scale-110 transition-transform duration-300" />
        </div>
        
        <div className="flex flex-col items-start">
          <span className="text-sm font-bold tracking-wide">Print Report</span>
          <span className="text-xs text-green-100 font-medium">Professional Copy</span>
        </div>
        
        {/* Pulse indicator */}
        <div className="relative">
          <div className="w-2 h-2 bg-white rounded-full"></div>
          <div className="absolute inset-0 w-2 h-2 bg-white rounded-full animate-ping opacity-75"></div>
        </div>
      </div>
      
      {/* Glow Effect */}
      <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-green-500/20 blur-xl -z-10"></div>
    </button>
  );
};
