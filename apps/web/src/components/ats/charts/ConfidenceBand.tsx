'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface ConfidenceBandProps {
  probability: number;
  confidenceInterval: [number, number];
  title: string;
  description?: string;
  className?: string;
}

export function ConfidenceBand({ 
  probability, 
  confidenceInterval, 
  title, 
  description, 
  className = '' 
}: ConfidenceBandProps) {
  const [min, max] = confidenceInterval;
  const range = max - min;
  const position = ((probability - min) / range) * 100;

  const getColorClass = (value: number) => {
    if (value >= 70) return 'text-green-600 bg-green-100 border-green-200';
    if (value >= 50) return 'text-blue-600 bg-blue-100 border-blue-200';
    if (value >= 30) return 'text-yellow-600 bg-yellow-100 border-yellow-200';
    return 'text-red-600 bg-red-100 border-red-200';
  };

  const getBandColor = (value: number) => {
    if (value >= 70) return 'from-green-200 to-green-400';
    if (value >= 50) return 'from-blue-200 to-blue-400';
    if (value >= 30) return 'from-yellow-200 to-yellow-400';
    return 'from-red-200 to-red-400';
  };

  return (
    <div className={`bg-white rounded-xl border border-gray-200 p-6 ${className}`}>
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-1">{title}</h3>
        {description && (
          <p className="text-sm text-gray-600">{description}</p>
        )}
      </div>

      {/* Main probability display */}
      <div className="text-center mb-6">
        <motion.div 
          className={`inline-flex items-center justify-center w-20 h-20 rounded-full border-2 ${getColorClass(probability)}`}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 100 }}
        >
          <span className="text-2xl font-bold">{probability}%</span>
        </motion.div>
        <div className="mt-2 text-sm text-gray-600">Predicted Probability</div>
      </div>

      {/* Confidence band visualization */}
      <div className="relative mb-4">
        <div className="text-xs text-gray-500 mb-2 flex justify-between">
          <span>Confidence Range</span>
          <span>{min}% - {max}%</span>
        </div>
        
        <div className="relative">
          {/* Background band */}
          <div className="h-6 bg-gray-100 rounded-lg overflow-hidden">
            <motion.div
              className={`h-full bg-gradient-to-r ${getBandColor(probability)} opacity-30`}
              initial={{ width: 0 }}
              animate={{ width: '100%' }}
              transition={{ duration: 1, delay: 0.3 }}
            />
          </div>
          
          {/* Probability indicator */}
          <motion.div
            className="absolute top-0 h-6 w-1 bg-gray-800 rounded-sm"
            style={{ left: `${position}%` }}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.5 }}
          />
          
          {/* Value label */}
          <motion.div
            className="absolute -top-8 transform -translate-x-1/2 text-xs font-medium text-gray-700"
            style={{ left: `${position}%` }}
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1, duration: 0.3 }}
          >
            {probability}%
          </motion.div>
        </div>

        {/* Range labels */}
        <div className="flex justify-between text-xs text-gray-500 mt-2">
          <span>{min}%</span>
          <span>{max}%</span>
        </div>
      </div>

      {/* Interpretation */}
      <div className="bg-gray-50 rounded-lg p-3">
        <div className="text-sm">
          <div className="font-medium text-gray-900 mb-1">Interpretation:</div>
          <div className="text-gray-600">
            {probability >= 70 && "Strong likelihood of success based on your profile analysis."}
            {probability >= 50 && probability < 70 && "Good potential with room for improvement in key areas."}
            {probability >= 30 && probability < 50 && "Moderate chances - focus on addressing skill gaps."}
            {probability < 30 && "Consider developing critical skills before applying."}
          </div>
        </div>
        
        <div className="mt-2 text-xs text-gray-500">
          95% confidence interval: {min}% - {max}%
        </div>
      </div>
    </div>
  );
}
