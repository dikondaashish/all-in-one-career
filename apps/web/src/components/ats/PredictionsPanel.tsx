'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Brain, TrendingUp, DollarSign, Zap, Shield, Calendar, Users } from 'lucide-react';
import { ConfidenceBand } from './charts/ConfidenceBand';
import { ProgressGauge, MultiGauge } from './charts/ProgressGauge';

interface PredictionsPanelProps {
  data: {
    hireProbability: {
      prob: number;
      confidenceInterval: [number, number];
      reasoning: string[];
    };
    interviewReadiness: {
      technical: number;
      behavioral: number;
      cultural: number;
      suggestions: string[];
    };
    salaryPlaybook: {
      conservative: number;
      market: number;
      aggressive: number;
      leveragePoints: string[];
      strategy: string[];
    };
    xFactor: string[];
    automationRisk: number;
  };
  interviewPrep?: any;
  negotiationStrategy?: any;
}

export function PredictionsPanel({ data, interviewPrep, negotiationStrategy }: PredictionsPanelProps) {
  const formatSalary = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getAutomationRiskLevel = (risk: number) => {
    if (risk < 30) return { level: 'Low', color: 'text-green-600 bg-green-100', icon: '🛡️' };
    if (risk < 60) return { level: 'Moderate', color: 'text-yellow-600 bg-yellow-100', icon: '⚠️' };
    return { level: 'High', color: 'text-red-600 bg-red-100', icon: '🚨' };
  };

  const automationRisk = getAutomationRiskLevel(data.automationRisk);

  return (
    <div className="space-y-6">
      {/* Hire Probability - Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <ConfidenceBand
          probability={data.hireProbability.prob}
          confidenceInterval={data.hireProbability.confidenceInterval}
          title="Hire Probability Prediction"
          description="AI-powered prediction based on comprehensive resume analysis"
        />
      </motion.div>

      {/* Interview Readiness */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.6 }}
      >
        <MultiGauge
          title="Interview Readiness Assessment"
          gauges={[
            {
              value: data.interviewReadiness.technical,
              label: "Technical",
              color: "blue"
            },
            {
              value: data.interviewReadiness.behavioral,
              label: "Behavioral", 
              color: "green"
            },
            {
              value: data.interviewReadiness.cultural,
              label: "Cultural Fit",
              color: "purple"
            }
          ]}
        />
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Salary Intelligence */}
        <motion.div
          className="bg-white rounded-xl border border-gray-200 p-6"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4, duration: 0.6 }}
        >
          <div className="flex items-center gap-2 mb-4">
            <DollarSign className="w-5 h-5 text-green-600" />
            <h3 className="text-lg font-semibold text-gray-900">Salary Negotiation Playbook</h3>
          </div>

          <div className="space-y-4">
            {/* Salary Ranges */}
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="p-3 bg-red-50 rounded-lg">
                <div className="text-sm text-red-600 font-medium">Conservative</div>
                <div className="text-lg font-bold text-red-700">
                  {formatSalary(data.salaryPlaybook.conservative)}
                </div>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg border-2 border-blue-200">
                <div className="text-sm text-blue-600 font-medium">Market Rate</div>
                <div className="text-lg font-bold text-blue-700">
                  {formatSalary(data.salaryPlaybook.market)}
                </div>
              </div>
              <div className="p-3 bg-green-50 rounded-lg">
                <div className="text-sm text-green-600 font-medium">Aggressive</div>
                <div className="text-lg font-bold text-green-700">
                  {formatSalary(data.salaryPlaybook.aggressive)}
                </div>
              </div>
            </div>

            {/* Leverage Points */}
            <div>
              <div className="text-sm font-medium text-gray-700 mb-2">Your Leverage Points:</div>
              <div className="space-y-2">
                {data.salaryPlaybook.leveragePoints.slice(0, 3).map((point, index) => (
                  <div key={index} className="flex items-center gap-2 text-sm text-gray-600">
                    <TrendingUp className="w-4 h-4 text-green-500" />
                    {point}
                  </div>
                ))}
              </div>
            </div>

            {/* Strategy Tips */}
            <div>
              <div className="text-sm font-medium text-gray-700 mb-2">Negotiation Strategy:</div>
              <div className="space-y-1">
                {data.salaryPlaybook.strategy.slice(0, 2).map((strategy, index) => (
                  <div key={index} className="text-xs text-gray-600 bg-gray-50 p-2 rounded">
                    💡 {strategy}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>

        {/* X-Factor & Automation Risk */}
        <motion.div
          className="space-y-4"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.6, duration: 0.6 }}
        >
          {/* X-Factor */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center gap-2 mb-4">
              <Zap className="w-5 h-5 text-yellow-500" />
              <h3 className="text-lg font-semibold text-gray-900">X-Factor Advantages</h3>
            </div>
            <div className="space-y-2">
              {data.xFactor.map((factor, index) => (
                <motion.div
                  key={index}
                  className="p-3 bg-yellow-50 rounded-lg border border-yellow-200"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.7 + index * 0.1, duration: 0.3 }}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-lg">⭐</span>
                    <span className="text-sm text-yellow-800">{factor}</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Automation Risk */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center gap-2 mb-4">
              <Shield className="w-5 h-5 text-gray-600" />
              <h3 className="text-lg font-semibold text-gray-900">Automation Risk Analysis</h3>
            </div>
            
            <div className="text-center mb-4">
              <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full ${automationRisk.color}`}>
                <span className="text-2xl">{automationRisk.icon}</span>
              </div>
              <div className="mt-2">
                <div className="text-2xl font-bold text-gray-900">{data.automationRisk}%</div>
                <div className="text-sm text-gray-600">{automationRisk.level} Risk</div>
              </div>
            </div>

            <div className="text-sm text-gray-600 text-center">
              {data.automationRisk < 30 && "Your role involves creative and strategic thinking that's difficult to automate."}
              {data.automationRisk >= 30 && data.automationRisk < 60 && "Consider developing skills in areas that complement automation."}
              {data.automationRisk >= 60 && "Focus on developing uniquely human skills like creativity and leadership."}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Reasoning & Recommendations */}
      <motion.div
        className="bg-white rounded-xl border border-gray-200 p-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8, duration: 0.6 }}
      >
        <div className="flex items-center gap-2 mb-4">
          <Brain className="w-5 h-5 text-purple-600" />
          <h3 className="text-lg font-semibold text-gray-900">AI Reasoning & Recommendations</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <div className="text-sm font-medium text-gray-700 mb-3">Prediction Reasoning:</div>
            <div className="space-y-2">
              {data.hireProbability.reasoning.map((reason, index) => (
                <div key={index} className="flex items-start gap-2 text-sm text-gray-600">
                  <div className="w-2 h-2 bg-purple-400 rounded-full mt-1.5 flex-shrink-0"></div>
                  {reason}
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="text-sm font-medium text-gray-700 mb-3">Interview Preparation:</div>
            <div className="space-y-2">
              {data.interviewReadiness.suggestions.slice(0, 4).map((suggestion, index) => (
                <div key={index} className="flex items-start gap-2 text-sm text-gray-600">
                  <Calendar className="w-3 h-3 text-blue-500 mt-1 flex-shrink-0" />
                  {suggestion}
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Quick Actions */}
      <motion.div
        className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-6 text-white"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1, duration: 0.6 }}
      >
        <h3 className="text-lg font-semibold mb-4">Recommended Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-white bg-opacity-20 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-4 h-4" />
              <span className="font-medium text-sm">Network</span>
            </div>
            <p className="text-xs text-blue-100">
              Connect with professionals in your target companies
            </p>
          </div>
          <div className="p-4 bg-white bg-opacity-20 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4" />
              <span className="font-medium text-sm">Skill Up</span>
            </div>
            <p className="text-xs text-blue-100">
              Focus on the most impactful missing skills
            </p>
          </div>
          <div className="p-4 bg-white bg-opacity-20 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Brain className="w-4 h-4" />
              <span className="font-medium text-sm">Practice</span>
            </div>
            <p className="text-xs text-blue-100">
              Prepare responses using the STAR method
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
