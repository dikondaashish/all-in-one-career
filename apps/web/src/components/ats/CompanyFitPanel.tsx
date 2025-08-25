'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Building, Target, Users, Code, TrendingUp, ExternalLink } from 'lucide-react';
import { ProgressGauge } from './charts/ProgressGauge';

interface CompanyFitPanelProps {
  data?: {
    cultureMatch: number;
    techStackMatch: number;
    backgroundFit: number;
    rewriteSuggestions: string[];
    keywordsToAdd: string[];
    keywordsToAvoid: string[];
  };
  companyName?: string;
}

export function CompanyFitPanel({ data, companyName }: CompanyFitPanelProps) {
  if (!data) {
    return (
      <div className="space-y-6">
        <motion.div
          className="bg-white rounded-xl border border-gray-200 p-8 text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Building className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Company Analysis Not Available</h3>
          <p className="text-gray-600 mb-4">
            Company-specific analysis requires a job URL or company name for deeper insights.
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="text-sm text-blue-800">
              <strong>Pro Tip:</strong> Include the company website or job posting URL in your next scan to unlock:
              <ul className="mt-2 space-y-1 text-left">
                <li>• Company culture alignment scoring</li>
                <li>• Tech stack compatibility analysis</li>
                <li>• Tailored resume optimization suggestions</li>
                <li>• Industry-specific keyword recommendations</li>
              </ul>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Company Fit Overview */}
      <motion.div
        className="bg-gradient-to-br from-green-600 to-blue-700 rounded-2xl p-6 text-white"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <h2 className="text-2xl font-bold mb-4">
          Company Fit Analysis
          {companyName && <span className="block text-lg text-green-200 mt-1">{companyName}</span>}
        </h2>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-3xl font-bold mb-1">{data.cultureMatch}%</div>
            <div className="text-green-200 text-sm">Culture Match</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold mb-1">{data.techStackMatch}%</div>
            <div className="text-green-200 text-sm">Tech Stack</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold mb-1">{data.backgroundFit}%</div>
            <div className="text-green-200 text-sm">Background Fit</div>
          </div>
        </div>
      </motion.div>

      {/* Detailed Fit Analysis */}
      <motion.div
        className="bg-white rounded-xl border border-gray-200 p-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.6 }}
      >
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Compatibility Breakdown</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <ProgressGauge
            value={data.cultureMatch}
            label="Culture Alignment"
            color={data.cultureMatch >= 70 ? 'green' : data.cultureMatch >= 50 ? 'blue' : 'yellow'}
            size="md"
          />
          <ProgressGauge
            value={data.techStackMatch}
            label="Technical Fit"
            color={data.techStackMatch >= 70 ? 'green' : data.techStackMatch >= 50 ? 'blue' : 'yellow'}
            size="md"
          />
          <ProgressGauge
            value={data.backgroundFit}
            label="Experience Match"
            color={data.backgroundFit >= 70 ? 'green' : data.backgroundFit >= 50 ? 'blue' : 'yellow'}
            size="md"
          />
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Resume Optimization */}
        <motion.div
          className="bg-white rounded-xl border border-gray-200 p-6"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4, duration: 0.6 }}
        >
          <div className="flex items-center gap-2 mb-4">
            <Target className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">Resume Optimization</h3>
          </div>

          <div className="space-y-4">
            {data.rewriteSuggestions.length > 0 && (
              <div>
                <div className="text-sm font-medium text-gray-700 mb-2">Rewrite Suggestions:</div>
                <div className="space-y-2">
                  {data.rewriteSuggestions.slice(0, 5).map((suggestion, index) => (
                    <motion.div
                      key={index}
                      className="p-3 bg-blue-50 rounded-lg border border-blue-100"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.5 + index * 0.1, duration: 0.3 }}
                    >
                      <div className="flex items-start gap-2">
                        <TrendingUp className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-blue-800">{suggestion}</span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </motion.div>

        {/* Keywords Strategy */}
        <motion.div
          className="bg-white rounded-xl border border-gray-200 p-6"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.6, duration: 0.6 }}
        >
          <div className="flex items-center gap-2 mb-4">
            <Code className="w-5 h-5 text-green-600" />
            <h3 className="text-lg font-semibold text-gray-900">Keywords Strategy</h3>
          </div>

          <div className="space-y-4">
            {/* Keywords to Add */}
            {data.keywordsToAdd.length > 0 && (
              <div>
                <div className="text-sm font-medium text-gray-700 mb-2">Keywords to Add:</div>
                <div className="flex flex-wrap gap-2">
                  {data.keywordsToAdd.map((keyword, index) => (
                    <motion.span
                      key={keyword}
                      className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.7 + index * 0.05, duration: 0.3 }}
                    >
                      + {keyword}
                    </motion.span>
                  ))}
                </div>
              </div>
            )}

            {/* Keywords to Avoid */}
            {data.keywordsToAvoid.length > 0 && (
              <div>
                <div className="text-sm font-medium text-gray-700 mb-2">Keywords to Avoid:</div>
                <div className="flex flex-wrap gap-2">
                  {data.keywordsToAvoid.map((keyword, index) => (
                    <motion.span
                      key={keyword}
                      className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.8 + index * 0.05, duration: 0.3 }}
                    >
                      - {keyword}
                    </motion.span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Best Practices */}
      <motion.div
        className="bg-white rounded-xl border border-gray-200 p-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8, duration: 0.6 }}
      >
        <div className="flex items-center gap-2 mb-4">
          <Users className="w-5 h-5 text-purple-600" />
          <h3 className="text-lg font-semibold text-gray-900">Company-Specific Best Practices</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <div className="text-sm font-medium text-gray-700 mb-3">Cultural Alignment Tips:</div>
            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex items-start gap-2">
                <div className="w-2 h-2 bg-purple-400 rounded-full mt-1.5 flex-shrink-0"></div>
                Research company values and reflect them in your summary
              </div>
              <div className="flex items-start gap-2">
                <div className="w-2 h-2 bg-purple-400 rounded-full mt-1.5 flex-shrink-0"></div>
                Use language that matches the company's communication style
              </div>
              <div className="flex items-start gap-2">
                <div className="w-2 h-2 bg-purple-400 rounded-full mt-1.5 flex-shrink-0"></div>
                Highlight experiences that demonstrate cultural fit
              </div>
            </div>
          </div>

          <div>
            <div className="text-sm font-medium text-gray-700 mb-3">Technical Optimization:</div>
            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex items-start gap-2">
                <div className="w-2 h-2 bg-purple-400 rounded-full mt-1.5 flex-shrink-0"></div>
                Prioritize technologies mentioned in the job description
              </div>
              <div className="flex items-start gap-2">
                <div className="w-2 h-2 bg-purple-400 rounded-full mt-1.5 flex-shrink-0"></div>
                Include relevant certifications and training
              </div>
              <div className="flex items-start gap-2">
                <div className="w-2 h-2 bg-purple-400 rounded-full mt-1.5 flex-shrink-0"></div>
                Demonstrate hands-on experience with key tools
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Action Items */}
      <motion.div
        className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl p-6 text-white"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1, duration: 0.6 }}
      >
        <h3 className="text-lg font-semibold mb-4">Immediate Action Items</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-white bg-opacity-20 rounded-lg">
            <div className="font-medium mb-2">📝 Update Resume</div>
            <div className="text-sm text-purple-100">
              Implement the top 3 rewrite suggestions
            </div>
          </div>
          <div className="p-4 bg-white bg-opacity-20 rounded-lg">
            <div className="font-medium mb-2">🔍 Research More</div>
            <div className="text-sm text-purple-100">
              Deep dive into company culture and recent news
            </div>
          </div>
          <div className="p-4 bg-white bg-opacity-20 rounded-lg">
            <div className="font-medium mb-2">💼 Network</div>
            <div className="text-sm text-purple-100">
              Connect with current employees on LinkedIn
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
