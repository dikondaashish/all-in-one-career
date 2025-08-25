'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface SkillData {
  skill: string;
  demand: 'hot' | 'stable' | 'declining';
  found: boolean;
  importance: 'CRITICAL' | 'IMPORTANT' | 'NICE';
  impactWeight?: number;
}

interface SkillHeatmapProps {
  skills: SkillData[];
  title: string;
  className?: string;
}

export function SkillHeatmap({ skills, title, className = '' }: SkillHeatmapProps) {
  const getDemandColor = (demand: string, found: boolean) => {
    if (!found) {
      return 'bg-gray-100 text-gray-400 border-gray-200';
    }
    
    switch (demand) {
      case 'hot':
        return 'bg-red-500 text-white shadow-lg shadow-red-200';
      case 'stable':
        return 'bg-blue-500 text-white shadow-lg shadow-blue-200';
      case 'declining':
        return 'bg-gray-400 text-white shadow-lg shadow-gray-200';
      default:
        return 'bg-gray-300 text-gray-700';
    }
  };

  const getImportanceIcon = (importance: string) => {
    switch (importance) {
      case 'CRITICAL':
        return '🔥';
      case 'IMPORTANT':
        return '⭐';
      case 'NICE':
        return '💡';
      default:
        return '';
    }
  };

  const getDemandLabel = (demand: string) => {
    switch (demand) {
      case 'hot':
        return 'High Demand';
      case 'stable':
        return 'Stable Demand';
      case 'declining':
        return 'Low Demand';
      default:
        return 'Unknown';
    }
  };

  // Group skills by categories for better organization
  const foundSkills = skills.filter(s => s.found);
  const missingSkills = skills.filter(s => !s.found);

  return (
    <div className={`bg-white rounded-xl border border-gray-200 p-6 ${className}`}>
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
        <p className="text-sm text-gray-600">
          Market demand analysis for your skill portfolio
        </p>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 mb-6 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-red-500 rounded"></div>
          <span>High Demand</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-blue-500 rounded"></div>
          <span>Stable Demand</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-gray-400 rounded"></div>
          <span>Low Demand</span>
        </div>
        <div className="flex items-center gap-2">
          <span>🔥 Critical</span>
          <span>⭐ Important</span>
          <span>💡 Nice to have</span>
        </div>
      </div>

      {/* Found Skills Section */}
      {foundSkills.length > 0 && (
        <div className="mb-6">
          <h4 className="text-md font-medium text-gray-800 mb-3 flex items-center gap-2">
            <span className="text-green-600">✓</span>
            Skills You Have ({foundSkills.length})
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {foundSkills.map((skill, index) => (
              <motion.div
                key={skill.skill}
                className={`p-3 rounded-lg border-2 transition-all duration-200 hover:scale-105 ${getDemandColor(skill.demand, skill.found)}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05, duration: 0.3 }}
                whileHover={{ y: -2 }}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="font-medium text-sm">{skill.skill}</div>
                  <span className="text-lg">{getImportanceIcon(skill.importance)}</span>
                </div>
                
                <div className="flex items-center justify-between text-xs">
                  <span className="opacity-90">{getDemandLabel(skill.demand)}</span>
                  {skill.impactWeight && (
                    <span className="bg-black bg-opacity-20 px-2 py-1 rounded">
                      Weight: {skill.impactWeight}
                    </span>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Missing Skills Section */}
      {missingSkills.length > 0 && (
        <div>
          <h4 className="text-md font-medium text-gray-800 mb-3 flex items-center gap-2">
            <span className="text-red-600">✗</span>
            Skills to Develop ({missingSkills.length})
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {missingSkills.map((skill, index) => (
              <motion.div
                key={skill.skill}
                className={`p-3 rounded-lg border-2 border-dashed transition-all duration-200 hover:scale-105 ${getDemandColor(skill.demand, skill.found)}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: (foundSkills.length + index) * 0.05, duration: 0.3 }}
                whileHover={{ y: -2 }}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="font-medium text-sm">{skill.skill}</div>
                  <span className="text-lg">{getImportanceIcon(skill.importance)}</span>
                </div>
                
                <div className="flex items-center justify-between text-xs">
                  <span className="opacity-75">{getDemandLabel(skill.demand)}</span>
                  {skill.importance === 'CRITICAL' && (
                    <span className="bg-red-100 text-red-700 px-2 py-1 rounded text-xs font-medium">
                      Priority
                    </span>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Summary Stats */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-green-600">{foundSkills.length}</div>
            <div className="text-xs text-gray-600">Skills Match</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-red-600">{missingSkills.length}</div>
            <div className="text-xs text-gray-600">Skills Gap</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-orange-600">
              {foundSkills.filter(s => s.demand === 'hot').length}
            </div>
            <div className="text-xs text-gray-600">Hot Skills</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-purple-600">
              {skills.filter(s => s.importance === 'CRITICAL').length}
            </div>
            <div className="text-xs text-gray-600">Critical Skills</div>
          </div>
        </div>
      </div>
    </div>
  );
}
