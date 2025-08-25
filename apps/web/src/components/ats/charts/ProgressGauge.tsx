'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface ProgressGaugeProps {
  value: number;
  max?: number;
  label: string;
  color?: 'blue' | 'green' | 'yellow' | 'red' | 'purple';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function ProgressGauge({ 
  value, 
  max = 100, 
  label, 
  color = 'blue', 
  size = 'md',
  className = '' 
}: ProgressGaugeProps) {
  const percentage = Math.min((value / max) * 100, 100);
  const circumference = 2 * Math.PI * 45; // radius = 45
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  const colorClasses = {
    blue: 'stroke-blue-600 text-blue-600',
    green: 'stroke-green-600 text-green-600',
    yellow: 'stroke-yellow-500 text-yellow-600',
    red: 'stroke-red-600 text-red-600',
    purple: 'stroke-purple-600 text-purple-600',
  };

  const sizeClasses = {
    sm: 'w-24 h-24',
    md: 'w-32 h-32',
    lg: 'w-40 h-40',
  };

  const textSizes = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-2xl',
  };

  return (
    <div className={`flex flex-col items-center ${className}`}>
      <div className={`relative ${sizeClasses[size]}`}>
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
          {/* Background circle */}
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="currentColor"
            strokeWidth="8"
            className="text-gray-200"
          />
          
          {/* Progress circle */}
          <motion.circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            strokeWidth="8"
            strokeLinecap="round"
            className={colorClasses[color]}
            style={{
              strokeDasharray,
              strokeDashoffset,
            }}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1.5, ease: "easeInOut" }}
          />
        </svg>
        
        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.span 
            className={`font-bold ${textSizes[size]} ${colorClasses[color]}`}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5, duration: 0.5 }}
          >
            {Math.round(value)}
          </motion.span>
          {size !== 'sm' && (
            <span className="text-xs text-gray-500 font-medium">
              {max === 100 ? '%' : `/${max}`}
            </span>
          )}
        </div>
      </div>
      
      <motion.div 
        className="mt-2 text-center"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8, duration: 0.3 }}
      >
        <div className="text-sm font-medium text-gray-900">{label}</div>
        
        {/* Performance indicator */}
        <div className="mt-1">
          {percentage >= 80 && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
              Excellent
            </span>
          )}
          {percentage >= 60 && percentage < 80 && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              Good
            </span>
          )}
          {percentage >= 40 && percentage < 60 && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
              Fair
            </span>
          )}
          {percentage < 40 && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
              Needs Work
            </span>
          )}
        </div>
      </motion.div>
    </div>
  );
}

interface MultiGaugeProps {
  gauges: Array<{
    value: number;
    label: string;
    color?: 'blue' | 'green' | 'yellow' | 'red' | 'purple';
  }>;
  title: string;
  className?: string;
}

export function MultiGauge({ gauges, title, className = '' }: MultiGaugeProps) {
  return (
    <div className={`bg-white rounded-xl border border-gray-200 p-6 ${className}`}>
      <h3 className="text-lg font-semibold text-gray-900 mb-6 text-center">{title}</h3>
      
      <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
        {gauges.map((gauge, index) => (
          <motion.div
            key={gauge.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1, duration: 0.5 }}
          >
            <ProgressGauge
              value={gauge.value}
              label={gauge.label}
              color={gauge.color}
              size="sm"
            />
          </motion.div>
        ))}
      </div>
    </div>
  );
}
