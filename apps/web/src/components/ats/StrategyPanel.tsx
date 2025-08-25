'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Rocket, Target, Clock, TrendingUp, Download, Calendar, CheckSquare, Star } from 'lucide-react';

interface StrategyPanelProps {
  data: {
    nextRoles: Array<{
      title: string;
      timeframe: string;
      probability: number;
      salaryRange: [number, number];
    }>;
    prioritySkills: Array<{
      skill: string;
      importance: 'CRITICAL' | 'IMPORTANT' | 'NICE';
      timeToAcquire: string;
    }>;
    actionsShortTerm: string[];
    actionsLongTerm: string[];
  };
  automationRisk?: number;
}

export function StrategyPanel({ data, automationRisk = 25 }: StrategyPanelProps) {
  const getImportanceColor = (importance: string) => {
    switch (importance) {
      case 'CRITICAL':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'IMPORTANT':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'NICE':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const formatSalary = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      {/* Career Roadmap */}
      <motion.div
        className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-2xl p-6 text-white"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <h2 className="text-2xl font-bold mb-6">Career Growth Strategy</h2>
        <div className="space-y-4">
          {data.nextRoles.map((role, index) => (
            <motion.div
              key={role.title}
              className="flex items-center justify-between p-4 bg-white bg-opacity-20 rounded-lg"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
            >
              <div className="flex items-center gap-4">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center bg-white bg-opacity-30 text-white font-bold`}>
                  {index + 1}
                </div>
                <div>
                  <div className="font-semibold text-lg">{role.title}</div>
                  <div className="text-indigo-200 text-sm">{role.timeframe}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-bold">{role.probability}%</div>
                <div className="text-indigo-200 text-sm">probability</div>
                <div className="text-xs text-indigo-100 mt-1">
                  {formatSalary(role.salaryRange[0])} - {formatSalary(role.salaryRange[1])}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Priority Skills Development */}
      <motion.div
        className="bg-white rounded-xl border border-gray-200 p-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.6 }}
      >
        <div className="flex items-center gap-2 mb-4">
          <Target className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">Priority Skills Development</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.prioritySkills.map((skill, index) => (
            <motion.div
              key={skill.skill}
              className={`p-4 rounded-lg border-2 ${getImportanceColor(skill.importance)}`}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 + index * 0.05, duration: 0.3 }}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="font-medium text-sm">{skill.skill}</div>
                <span className="text-xs px-2 py-1 bg-white bg-opacity-70 rounded">
                  {skill.importance}
                </span>
              </div>
              <div className="flex items-center gap-1 text-xs opacity-80">
                <Clock className="w-3 h-3" />
                {skill.timeToAcquire}
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Short-term Actions */}
        <motion.div
          className="bg-white rounded-xl border border-gray-200 p-6"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4, duration: 0.6 }}
        >
          <div className="flex items-center gap-2 mb-4">
            <Rocket className="w-5 h-5 text-green-600" />
            <h3 className="text-lg font-semibold text-gray-900">Immediate Actions (Next 30 Days)</h3>
          </div>

          <div className="space-y-3">
            {data.actionsShortTerm.map((action, index) => (
              <motion.div
                key={index}
                className="flex items-start gap-3 p-3 bg-green-50 rounded-lg border border-green-100"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + index * 0.1, duration: 0.3 }}
              >
                <CheckSquare className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span className="text-sm text-green-800">{action}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Long-term Strategy */}
        <motion.div
          className="bg-white rounded-xl border border-gray-200 p-6"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.6, duration: 0.6 }}
        >
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-purple-600" />
            <h3 className="text-lg font-semibold text-gray-900">Long-term Growth (3-12 Months)</h3>
          </div>

          <div className="space-y-3">
            {data.actionsLongTerm.map((action, index) => (
              <motion.div
                key={index}
                className="flex items-start gap-3 p-3 bg-purple-50 rounded-lg border border-purple-100"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.7 + index * 0.1, duration: 0.3 }}
              >
                <Star className="w-4 h-4 text-purple-600 mt-0.5 flex-shrink-0" />
                <span className="text-sm text-purple-800">{action}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Automation Risk Assessment */}
      <motion.div
        className="bg-white rounded-xl border border-gray-200 p-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8, duration: 0.6 }}
      >
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Future-Proofing Your Career</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <div className="text-sm font-medium text-gray-700 mb-2">Automation Risk Level</div>
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className={`h-3 rounded-full ${
                      automationRisk < 30 ? 'bg-green-500' :
                      automationRisk < 60 ? 'bg-yellow-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${automationRisk}%` }}
                  />
                </div>
              </div>
              <div className="text-xl font-bold text-gray-900">{automationRisk}%</div>
            </div>
            <div className="text-sm text-gray-600 mt-2">
              {automationRisk < 30 && "Low risk - Your skills are highly human-centric"}
              {automationRisk >= 30 && automationRisk < 60 && "Moderate risk - Consider diversifying skills"}
              {automationRisk >= 60 && "Higher risk - Focus on uniquely human capabilities"}
            </div>
          </div>

          <div>
            <div className="text-sm font-medium text-gray-700 mb-3">Future-Proof Skills to Develop:</div>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                Creative problem solving and innovation
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                Emotional intelligence and communication
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                Strategic thinking and leadership
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                Cross-functional collaboration
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Action Plan Summary */}
      <motion.div
        className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-xl p-6 text-white"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1, duration: 0.6 }}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Your Career Action Plan</h3>
          <button className="flex items-center gap-2 bg-white bg-opacity-20 hover:bg-opacity-30 px-4 py-2 rounded-lg transition-colors">
            <Download className="w-4 h-4" />
            <span className="text-sm">Export PDF</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="p-4 bg-white bg-opacity-10 rounded-lg">
            <Calendar className="w-5 h-5 mb-2" />
            <div className="font-medium text-sm">This Week</div>
            <div className="text-xs text-gray-300">
              {data.actionsShortTerm.length} immediate actions
            </div>
          </div>
          <div className="p-4 bg-white bg-opacity-10 rounded-lg">
            <Target className="w-5 h-5 mb-2" />
            <div className="font-medium text-sm">This Month</div>
            <div className="text-xs text-gray-300">
              Focus on {data.prioritySkills.filter(s => s.importance === 'CRITICAL').length} critical skills
            </div>
          </div>
          <div className="p-4 bg-white bg-opacity-10 rounded-lg">
            <TrendingUp className="w-5 h-5 mb-2" />
            <div className="font-medium text-sm">This Quarter</div>
            <div className="text-xs text-gray-300">
              {data.actionsLongTerm.length} growth initiatives
            </div>
          </div>
          <div className="p-4 bg-white bg-opacity-10 rounded-lg">
            <Rocket className="w-5 h-5 mb-2" />
            <div className="font-medium text-sm">Next Role</div>
            <div className="text-xs text-gray-300">
              {data.nextRoles[0]?.timeframe || '12-18 months'}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
