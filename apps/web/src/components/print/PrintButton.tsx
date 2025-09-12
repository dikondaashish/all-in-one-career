/**
 * Print Button Component - Modern print functionality with clean UI
 */

'use client';

import React, { useState } from 'react';
import { Printer, Loader2 } from 'lucide-react';
import { printElementToPdf } from '@/lib/printReport';
import { printElementToPdfSimple } from '@/lib/printReportSimple';
import { printElementToPdfFixed } from '@/lib/printReportFixed';

interface PrintButtonProps {
  scanId: string;
}

export const PrintButton: React.FC<PrintButtonProps> = ({ scanId }) => {
  const [isGenerating, setIsGenerating] = useState(false);

  const handlePrint = async () => {
    if (isGenerating) return;
    
    try {
      setIsGenerating(true);
      
      // Find the printable report area
      const printArea = document.getElementById('print-area');
      if (!printArea) {
        console.error('Print area not found');
        alert('Unable to find report content to print. Please try again.');
        return;
      }
      
      // Generate PDF with the scan ID in filename
      const fileName = `ats-report-${scanId}.pdf`;
      
      console.log('Attempting fixed PDF generation (handles oklch colors)...');
      let success = await printElementToPdfFixed(printArea, fileName);
      
      if (!success) {
        console.log('Fixed PDF generation failed, trying simple approach...');
        success = await printElementToPdfSimple(printArea, fileName);
        
        if (!success) {
          console.log('Simple PDF generation failed, trying advanced approach...');
          success = await printElementToPdf(printArea, fileName);
          
          if (!success) {
            console.warn('All PDF generation methods failed');
            alert('PDF generation failed. This might be due to complex CSS styling. You can try the browser print dialog as a fallback.');
          } else {
            console.log('Advanced PDF generation succeeded as last resort');
          }
        } else {
          console.log('Simple PDF generation succeeded');
        }
      } else {
        console.log('Fixed PDF generation succeeded');
      }
    } catch (error) {
      console.error('Error during print operation:', error);
      alert('Failed to generate PDF. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <button
      onClick={handlePrint}
      disabled={isGenerating}
      className="group relative overflow-hidden bg-gradient-to-r from-slate-600 via-slate-700 to-slate-800 hover:from-slate-700 hover:via-slate-800 hover:to-slate-900 text-white font-semibold py-3 px-6 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 ease-out border border-slate-600/20 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none"
    >
      {/* Animated Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-r from-slate-500/20 to-slate-700/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      
      {/* Shimmer Effect */}
      <div className="absolute inset-0 -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
      
      {/* Content */}
      <div className="relative flex items-center space-x-3">
        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-white/10 group-hover:bg-white/20 transition-colors duration-300">
          {isGenerating ? (
            <Loader2 className="w-5 h-5 text-white animate-spin" />
          ) : (
            <Printer className="w-5 h-5 text-white group-hover:scale-110 transition-transform duration-300" />
          )}
        </div>
        
        <div className="flex flex-col items-start">
          <span className="text-sm font-bold tracking-wide">
            {isGenerating ? 'Generating...' : 'Print Report'}
          </span>
          <span className="text-xs text-slate-100 font-medium">
            {isGenerating ? 'Please wait' : 'Full Analysis'}
          </span>
        </div>
        
        {/* Print indicator */}
        {!isGenerating && (
          <div className="relative">
            <div className="w-2 h-2 bg-white rounded-full"></div>
            <div className="absolute inset-0 w-2 h-2 bg-white rounded-full animate-ping opacity-75"></div>
          </div>
        )}
      </div>
      
      {/* Glow Effect */}
      <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-slate-600/20 blur-xl -z-10"></div>
    </button>
  );
};
