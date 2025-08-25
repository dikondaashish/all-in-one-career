'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, AlertTriangle, CheckCircle, Target } from 'lucide-react';
import { ProgressGauge } from './charts/ProgressGauge';

interface OverviewPanelProps {
  data: {
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
    priorityFixes: string[];
  };
}

export function OverviewPanel({ data }: OverviewPanelProps) {
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-50 border-green-200';
    if (score >= 60) return 'text-blue-600 bg-blue-50 border-blue-200';
    if (score >= 40) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  const getPercentileMessage = (percentile: number) => {
    if (percentile >= 90) return "You're in the top 10% of candidates!";
    if (percentile >= 75) return "You're performing better than most candidates";
    if (percentile >= 50) return "You're performing above average";
    if (percentile >= 25) return "You have room for improvement";
    return "Focus on key areas for significant improvement";
  };

  return (
    <div className="space-y-6">
      {/* Hero Score Section */}
      <motion.div
        className="bg-gradient-to-br from-blue-600 to-purple-700 rounded-2xl p-8 text-white"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-2">Your ATS Score</h2>
            <p className="text-blue-100 mb-4">
              Comprehensive analysis based on industry standards
            </p>
            <div className="flex items-baseline gap-2">
              <motion.span 
                className="text-5xl font-bold"
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3, duration: 0.5 }}
              >
                {data.overallScore}
              </motion.span>
              <span className="text-xl text-blue-200">/100</span>
            </div>
          </div>
          
          <div className="text-right">
            <div className="text-3xl font-bold mb-2">{data.percentile}th</div>
            <div className="text-blue-200 text-sm">Percentile</div>
            <div className="mt-2 text-xs text-blue-100">
              {getPercentileMessage(data.percentile)}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Score Breakdown */}
      <motion.div
        className="bg-white rounded-xl border border-gray-200 p-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.6 }}
      >
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Score Breakdown</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          <ProgressGauge
            value={data.breakdown.atsCompatibility}
            label="ATS Compatibility"
            color="blue"
            size="sm"
          />
          <ProgressGauge
            value={data.breakdown.skillMatch}
            label="Skill Match"
            color="green"
            size="sm"
          />
          <ProgressGauge
            value={data.breakdown.recruiterPsychology}
            label="Recruiter Appeal"
            color="purple"
            size="sm"
          />
          <ProgressGauge
            value={data.breakdown.marketAlignment}
            label="Market Fit"
            color="yellow"
            size="sm"
          />
          <ProgressGauge
            value={data.breakdown.predictions}
            label="Hire Potential"
            color="red"
            size="sm"
          />
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Strengths */}
        <motion.div
          className="bg-white rounded-xl border border-gray-200 p-6"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4, duration: 0.6 }}
        >
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <h3 className="text-lg font-semibold text-gray-900">Top Strengths</h3>
          </div>
          <div className="space-y-3">
            {data.strengths.slice(0, 5).map((strength, index) => (
              <motion.div
                key={index}
                className="flex items-start gap-3 p-3 bg-green-50 rounded-lg border border-green-100"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + index * 0.1, duration: 0.3 }}
              >
                <TrendingUp className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span className="text-sm text-green-800">{strength}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Priority Fixes */}
        <motion.div
          className="bg-white rounded-xl border border-gray-200 p-6"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.6, duration: 0.6 }}
        >
          <div className="flex items-center gap-2 mb-4">
            <Target className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">Priority Fixes</h3>
          </div>
          <div className="space-y-3">
            {data.priorityFixes.slice(0, 5).map((fix, index) => (
              <motion.div
                key={index}
                className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg border border-blue-100"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.7 + index * 0.1, duration: 0.3 }}
              >
                <AlertTriangle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <span className="text-sm text-blue-800">{fix}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Areas for Improvement */}
      {data.weaknesses.length > 0 && (
        <motion.div
          className="bg-white rounded-xl border border-gray-200 p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.6 }}
        >
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-5 h-5 text-yellow-600" />
            <h3 className="text-lg font-semibold text-gray-900">Areas for Improvement</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {data.weaknesses.map((weakness, index) => (
              <motion.div
                key={index}
                className="p-3 bg-yellow-50 rounded-lg border border-yellow-100"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.9 + index * 0.05, duration: 0.3 }}
              >
                <span className="text-sm text-yellow-800">{weakness}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Action Items */}
      <motion.div
        className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-xl p-6 text-white"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1, duration: 0.6 }}
      >
        <h3 className="text-lg font-semibold mb-3">Next Steps</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="p-4 bg-white bg-opacity-10 rounded-lg">
            <div className="font-medium mb-2">🎯 Immediate Actions</div>
            <div className="text-gray-300">
              Focus on the top 3 priority fixes to see quick improvements
            </div>
          </div>
          <div className="p-4 bg-white bg-opacity-10 rounded-lg">
            <div className="font-medium mb-2">📚 Skill Development</div>
            <div className="text-gray-300">
              Identify and learn the most critical missing skills
            </div>
          </div>
          <div className="p-4 bg-white bg-opacity-10 rounded-lg">
            <div className="font-medium mb-2">🔄 Regular Updates</div>
            <div className="text-gray-300">
              Re-scan periodically to track your progress
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
