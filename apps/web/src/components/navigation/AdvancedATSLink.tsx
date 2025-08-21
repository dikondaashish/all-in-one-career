'use client';

import Link from 'next/link';
import { Zap, ArrowRight } from 'lucide-react';

export const AdvancedATSLink = () => {
  return (
    <Link 
      href="/ats/advanced" 
      className="group block bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg p-4 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-white/20 rounded-lg">
            <Zap className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-semibold text-lg">Advanced ATS Scanner</h3>
            <p className="text-blue-100 text-sm">
              Dual-panel analysis with URL extraction & export
            </p>
          </div>
        </div>
        <ArrowRight className="w-5 h-5 text-white/80 group-hover:text-white group-hover:translate-x-1 transition-all" />
      </div>
      
      <div className="mt-3 text-xs text-blue-100">
        ✨ NEW: Real-time analysis • PDF/DOCX support • Job portal scraping
      </div>
    </Link>
  );
};

export default AdvancedATSLink;
