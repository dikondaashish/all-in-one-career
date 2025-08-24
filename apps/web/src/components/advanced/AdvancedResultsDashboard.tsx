'use client';
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Brain, 
  TrendingUp, 
  Target, 
  Users, 
  DollarSign, 
  Calendar,
  Award,
  AlertTriangle,
  Lightbulb,
  BarChart3,
  Radar,
  Star,
  Trophy,
  Crown,
  Rocket,
  Eye,
  Zap
} from 'lucide-react';

interface AdvancedResultsProps {
  scanId: string;
  results: {
    // Basic scores (existing)
    overallScore: number;
    matchRate: number;
    searchability: number;
    atsCompatibility: number;
    
    // NEW: Advanced Analysis
    skillRelevancy: any;
    careerTrajectory: any;
    impactScore: any;
    recruiterAppeal: any;
    redFlags: any;
    
    // NEW: Predictions
    hireProbability: any;
    interviewReadiness: any;
    salaryNegotiation: any;
    
    // NEW: Intelligence
    industryIntel: any;
    marketPosition: any;
    competitiveAnalysis?: any;
    companyOptimization?: any;
  };
}

export const AdvancedResultsDashboard: React.FC<AdvancedResultsProps> = ({ 
  scanId, 
  results 
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'predictions' | 'intelligence' | 'strategy'>('overview');
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Trigger animations after component mounts
    setTimeout(() => setIsVisible(true), 100);
  }, []);

  // Inject custom animations
  useEffect(() => {
    const customStyles = `
      @keyframes slideInRight {
        from { transform: translateX(30px); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
      
      @keyframes slideInLeft {
        from { transform: translateX(-30px); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
      
      @keyframes bounceIn {
        0% { transform: scale(0.3); opacity: 0; }
        50% { transform: scale(1.05); }
        70% { transform: scale(0.9); }
        100% { transform: scale(1); opacity: 1; }
      }
      
      @keyframes fadeInUp {
        from { transform: translateY(30px); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
      }
      
      @keyframes pulse {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.05); }
      }
      
      .slide-in-right { animation: slideInRight 0.6s ease-out; }
      .slide-in-left { animation: slideInLeft 0.6s ease-out; }
      .bounce-in { animation: bounceIn 0.8s ease-out; }
      .fade-in-up { animation: fadeInUp 0.6s ease-out; }
      .pulse-animation { animation: pulse 2s infinite; }
    `;
    
    if (typeof document !== 'undefined') {
      const styleElement = document.createElement('style');
      styleElement.textContent = customStyles;
      document.head.appendChild(styleElement);
      
      return () => {
        document.head.removeChild(styleElement);
      };
    }
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        
        {/* Hero Section */}
        <motion.div 
          className="text-center mb-12"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="inline-flex items-center gap-3 mb-4 px-6 py-3 bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-full border border-blue-500/30">
            <Brain className="w-6 h-6 text-blue-400" />
            <span className="text-blue-300 font-medium">Advanced AI Analysis Complete</span>
          </div>
          
          <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-4">
            Your Career Intelligence Report
          </h1>
          
          <p className="text-xl text-slate-300 max-w-3xl mx-auto">
            The world's first AI-powered career analysis that predicts your hiring success, 
            optimizes for specific companies, and maps your future growth trajectory.
          </p>
        </motion.div>

        {/* Main Score Circle */}
        <motion.div 
          className="flex justify-center mb-12"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.3, type: "spring", stiffness: 100 }}
        >
          <div className="relative">
            <svg width="300" height="300" className="transform -rotate-90">
              <circle
                cx="150"
                cy="150"
                r="120"
                stroke="rgba(100, 116, 139, 0.3)"
                strokeWidth="20"
                fill="transparent"
              />
              <motion.circle
                cx="150"
                cy="150"
                r="120"
                stroke="url(#gradient)"
                strokeWidth="20"
                fill="transparent"
                strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 120}`}
                strokeDashoffset={`${2 * Math.PI * 120 * (1 - results.overallScore / 100)}`}
                initial={{ strokeDashoffset: 2 * Math.PI * 120 }}
                animate={{ strokeDashoffset: 2 * Math.PI * 120 * (1 - results.overallScore / 100) }}
                transition={{ duration: 2, ease: "easeOut" }}
              />
              <defs>
                <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#3B82F6" />
                  <stop offset="50%" stopColor="#8B5CF6" />
                  <stop offset="100%" stopColor="#EC4899" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="text-6xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                  {results.overallScore}
                </div>
                <div className="text-slate-300 text-lg">Overall Score</div>
                <div className="text-sm text-slate-400 mt-2">
                  {results.overallScore >= 80 ? 'Excellent' : 
                   results.overallScore >= 70 ? 'Good' : 
                   results.overallScore >= 60 ? 'Fair' : 'Needs Improvement'}
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Tab Navigation */}
        <div className="flex justify-center mb-8">
          <div className="bg-slate-800/50 backdrop-blur-lg rounded-2xl p-2 border border-slate-700/50">
            {[
              { id: 'overview', label: 'Overview', icon: BarChart3 },
              { id: 'predictions', label: 'Predictions', icon: TrendingUp },
              { id: 'intelligence', label: 'Intelligence', icon: Brain },
              { id: 'strategy', label: 'Strategy', icon: Target }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl transition-all duration-300 ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                    : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
                }`}
              >
                <tab.icon className="w-5 h-5" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          {activeTab === 'overview' && (
            <OverviewTab results={results} isVisible={isVisible} />
          )}
          {activeTab === 'predictions' && (
            <PredictionsTab results={results} isVisible={isVisible} />
          )}
          {activeTab === 'intelligence' && (
            <IntelligenceTab results={results} isVisible={isVisible} />
          )}
          {activeTab === 'strategy' && (
            <StrategyTab results={results} isVisible={isVisible} />
          )}
        </AnimatePresence>

      </div>
    </div>
  );
};

// Overview Tab Component
const OverviewTab: React.FC<{ results: any; isVisible: boolean }> = ({ results, isVisible }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -20 }}
    transition={{ duration: 0.5 }}
    className="space-y-8"
  >
    {/* Core Metrics */}
    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-6">
      {[
        { label: 'Match Rate', value: results.matchRate, icon: Target, color: 'blue' },
        { label: 'ATS Compatible', value: results.atsCompatibility, icon: Award, color: 'green' },
        { label: 'Searchability', value: results.searchability, icon: TrendingUp, color: 'purple' },
        { label: 'Hire Probability', value: results.hireProbability?.probability || 0, icon: Users, color: 'pink' }
      ].map((metric, index) => (
        <motion.div
          key={metric.label}
          className={`bg-slate-800/50 backdrop-blur-lg rounded-2xl p-6 border border-slate-700/50 hover:scale-105 transition-all duration-300 ${
            isVisible ? 'fade-in-up' : ''
          }`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          style={{ transitionDelay: `${index * 100}ms` }}
        >
          <div className="flex items-center justify-between mb-4">
            <metric.icon className={`w-8 h-8 text-${metric.color}-400`} />
            <span className={`text-3xl font-bold text-${metric.color}-400`}>
              {metric.value}%
            </span>
          </div>
          <h3 className="text-slate-300 font-medium">{metric.label}</h3>
          <div className="w-full bg-slate-700 rounded-full h-2 mt-3">
            <motion.div
              className={`h-2 bg-gradient-to-r from-${metric.color}-500 to-${metric.color}-400 rounded-full`}
              initial={{ width: 0 }}
              animate={{ width: `${metric.value}%` }}
              transition={{ duration: 1, delay: index * 0.1 + 0.5 }}
            />
          </div>
        </motion.div>
      ))}
    </div>

    {/* Skills Analysis */}
    <div className={`bg-slate-800/50 backdrop-blur-lg rounded-2xl p-6 border border-slate-700/50 ${
      isVisible ? 'slide-in-right' : ''
    }`}>
      <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
        <Radar className="w-6 h-6 text-blue-400" />
        Skill Relevancy Analysis
      </h3>
      
      {results.skillRelevancy?.contextualMatches?.slice(0, 5).map((skill: any, index: number) => (
        <div key={index} className={`flex items-center justify-between py-3 border-b border-slate-700/50 last:border-b-0 ${
          isVisible ? 'bounce-in' : ''
        }`} style={{ animationDelay: `${index * 200}ms` }}>
          <div>
            <span className="text-white font-medium">{skill.skillName}</span>
            <div className="text-sm text-slate-400 mt-1">
              Impact Level: <span className={`capitalize text-${skill.impactLevel === 'high' ? 'green' : skill.impactLevel === 'medium' ? 'yellow' : 'red'}-400`}>
                {skill.impactLevel}
              </span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-lg font-bold text-blue-400">
              {(skill.relevancyMultiplier * 10).toFixed(0)}%
            </div>
            <div className="text-xs text-slate-500">Relevancy</div>
          </div>
        </div>
      ))}
    </div>

    {/* Competitive Position */}
    {results.competitiveAnalysis && (
      <div className={`bg-slate-800/50 backdrop-blur-lg rounded-2xl p-6 border border-slate-700/50 ${
        isVisible ? 'slide-in-left' : ''
      }`}>
        <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <Crown className="w-6 h-6 text-yellow-400" />
          Competitive Market Position
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-yellow-400 mb-2">
              {results.competitiveAnalysis.marketPosition?.percentile || 0}th
            </div>
            <div className="text-slate-300">Percentile</div>
            <div className="text-sm text-slate-500 mt-1">Among all candidates</div>
          </div>
          
          <div className="text-center">
            <div className="text-3xl font-bold text-green-400 mb-2">
              {results.competitiveAnalysis.marketPosition?.compareToHired?.similarity || 0}%
            </div>
            <div className="text-slate-300">Similarity to Hired</div>
            <div className="text-sm text-slate-500 mt-1">Profile match</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-400 mb-2">
              ${results.competitiveAnalysis.marketPosition?.salaryBenchmark?.estimatedRange?.[0]?.toLocaleString() || 0}k+
            </div>
            <div className="text-slate-300">Target Salary</div>
            <div className="text-sm text-slate-500 mt-1">Market estimate</div>
          </div>
        </div>
      </div>
    )}

    {/* Red Flags Alert */}
    {results.redFlags?.flags?.length > 0 && (
      <div className="bg-red-900/20 backdrop-blur-lg rounded-2xl p-6 border border-red-500/30">
        <h3 className="text-xl font-bold text-red-400 mb-4 flex items-center gap-2">
          <AlertTriangle className="w-6 h-6" />
          Areas for Attention
        </h3>
        {results.redFlags.flags.map((flag: string, index: number) => (
          <div key={index} className="flex items-start gap-3 py-2">
            <AlertTriangle className="w-4 h-4 text-red-400 mt-1 flex-shrink-0" />
            <span className="text-red-200">{flag}</span>
          </div>
        ))}
      </div>
    )}
  </motion.div>
);

// Predictions Tab Component  
const PredictionsTab: React.FC<{ results: any; isVisible: boolean }> = ({ results, isVisible }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -20 }}
    transition={{ duration: 0.5 }}
    className="space-y-6"
  >
    {/* Hire Probability Section */}
    <div className={`bg-slate-800/50 backdrop-blur-lg rounded-2xl p-8 border border-slate-700/50 ${
      isVisible ? 'fade-in-up' : ''
    }`}>
      <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
        <TrendingUp className="w-8 h-8 text-green-400" />
        Hire Probability Analysis
      </h3>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="text-center">
          <div className="text-4xl font-bold text-green-400 mb-2 pulse-animation">
            {results.hireProbability?.probability || 0}%
          </div>
          <div className="text-slate-300">Hire Probability</div>
          <div className="text-sm text-slate-500 mt-1">
            Range: {results.hireProbability?.confidenceInterval?.[0] || 0}% - {results.hireProbability?.confidenceInterval?.[1] || 0}%
          </div>
        </div>
        
        <div className="text-center">
          <div className="text-4xl font-bold text-blue-400 mb-2">
            {results.hireProbability?.interviewProbability || 0}%
          </div>
          <div className="text-slate-300">Interview Likelihood</div>
          <div className="text-sm text-slate-500 mt-1">First round screening</div>
        </div>
        
        <div className="text-center">
          <div className="text-3xl font-bold text-purple-400 mb-2">
            ${results.hireProbability?.salaryRange?.[0]?.toLocaleString() || 0}k - ${results.hireProbability?.salaryRange?.[1]?.toLocaleString() || 0}k
          </div>
          <div className="text-slate-300">Expected Salary</div>
          <div className="text-sm text-slate-500 mt-1">Market rate estimate</div>
        </div>
      </div>

      {/* Reasoning */}
      <div className="bg-slate-700/30 rounded-xl p-4">
        <h4 className="font-semibold text-white mb-3">Why this prediction?</h4>
        <div className="space-y-2">
          {results.hireProbability?.reasoning?.map((reason: string, index: number) => (
            <div key={index} className="flex items-start gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full mt-2 flex-shrink-0"></div>
              <span className="text-slate-300">{reason}</span>
            </div>
          ))}
        </div>
      </div>
    </div>

    {/* Interview Readiness */}
    <div className={`bg-slate-800/50 backdrop-blur-lg rounded-2xl p-8 border border-slate-700/50 ${
      isVisible ? 'slide-in-right' : ''
    }`}>
      <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
        <Calendar className="w-8 h-8 text-blue-400" />
        Interview Readiness Assessment
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { 
            type: 'Technical', 
            score: results.interviewReadiness?.interviewTypePrediction?.technical?.score || 0,
            color: 'blue',
            icon: Brain
          },
          { 
            type: 'Behavioral', 
            score: results.interviewReadiness?.interviewTypePrediction?.behavioral?.score || 0,
            color: 'purple',
            icon: Users
          },
          { 
            type: 'Cultural', 
            score: results.interviewReadiness?.interviewTypePrediction?.cultural?.score || 0,
            color: 'green',
            icon: Award
          }
        ].map((category, index) => (
          <div key={category.type} className={`text-center ${
            isVisible ? 'bounce-in' : ''
          }`} style={{ animationDelay: `${index * 300}ms` }}>
            <div className="mb-4">
              <category.icon className={`w-12 h-12 text-${category.color}-400 mx-auto mb-2`} />
              <div className={`text-3xl font-bold text-${category.color}-400`}>
                {category.score}%
              </div>
              <div className="text-slate-300 font-medium">{category.type}</div>
            </div>
            
            <div className="w-full bg-slate-700 rounded-full h-3">
              <motion.div
                className={`h-3 bg-gradient-to-r from-${category.color}-500 to-${category.color}-400 rounded-full`}
                initial={{ width: 0 }}
                animate={{ width: `${category.score}%` }}
                transition={{ duration: 1, delay: 0.5 + index * 0.2 }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>

    {/* Salary Negotiation Intelligence */}
    <div className={`bg-slate-800/50 backdrop-blur-lg rounded-2xl p-8 border border-slate-700/50 ${
      isVisible ? 'slide-in-left' : ''
    }`}>
      <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
        <DollarSign className="w-8 h-8 text-green-400" />
        Salary Negotiation Intelligence
      </h3>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <h4 className="text-lg font-semibold text-white mb-4">Your Market Value</h4>
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-slate-700/30 rounded-lg">
              <span className="text-slate-300">Conservative</span>
              <span className="font-bold text-red-400">
                ${results.salaryNegotiation?.marketValue?.conservative?.toLocaleString() || 0}
              </span>
            </div>
            <div className="flex justify-between items-center p-3 bg-slate-700/30 rounded-lg border-l-4 border-green-400">
              <span className="text-slate-300">Market Rate</span>
              <span className="font-bold text-green-400">
                ${results.salaryNegotiation?.marketValue?.market?.toLocaleString() || 0}
              </span>
            </div>
            <div className="flex justify-between items-center p-3 bg-slate-700/30 rounded-lg">
              <span className="text-slate-300">Aggressive</span>
              <span className="font-bold text-blue-400">
                ${results.salaryNegotiation?.marketValue?.aggressive?.toLocaleString() || 0}
              </span>
            </div>
          </div>
        </div>
        
        <div>
          <h4 className="text-lg font-semibold text-white mb-4">Negotiation Strategy</h4>
          <div className="space-y-4">
            <div className={`inline-flex px-4 py-2 rounded-full text-sm font-medium ${
              results.salaryNegotiation?.negotiationStrength === 'strong' ? 'bg-green-900/30 text-green-400' :
              results.salaryNegotiation?.negotiationStrength === 'moderate' ? 'bg-yellow-900/30 text-yellow-400' :
              'bg-red-900/30 text-red-400'
            }`}>
              {results.salaryNegotiation?.negotiationStrength?.toUpperCase() || 'MODERATE'} Position
            </div>
            
            <div className="bg-slate-700/30 rounded-lg p-4">
              <div className="font-medium text-white mb-2">Key Leverage Points:</div>
              <ul className="space-y-1">
                {results.salaryNegotiation?.leveragePoints?.slice(0, 3).map((point: string, index: number) => (
                  <li key={index} className="text-sm text-slate-300 flex items-start gap-2">
                    <div className="w-1.5 h-1.5 bg-green-400 rounded-full mt-2 flex-shrink-0"></div>
                    {point}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  </motion.div>
);

// Intelligence Tab Component
const IntelligenceTab: React.FC<{ results: any; isVisible: boolean }> = ({ results, isVisible }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -20 }}
    transition={{ duration: 0.5 }}
    className="space-y-6"
  >
    {/* Industry Intelligence */}
    <div className={`bg-slate-800/50 backdrop-blur-lg rounded-2xl p-8 border border-slate-700/50 ${
      isVisible ? 'fade-in-up' : ''
    }`}>
      <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
        <Brain className="w-8 h-8 text-purple-400" />
        Industry Intelligence Analysis
      </h3>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="text-center">
          <div className="text-xl font-bold text-purple-400 mb-2">
            {results.industryIntel?.industryDetection?.primary || 'Unknown'}
          </div>
          <div className="text-slate-300">Primary Industry</div>
          <div className="text-sm text-slate-500 mt-1">
            {Math.round((results.industryIntel?.industryDetection?.confidence || 0) * 100)}% confidence
          </div>
        </div>
        
        <div className="text-center">
          <div className="text-xl font-bold text-blue-400 mb-2">
            {results.competitiveAnalysis?.marketPosition?.percentile || 0}th
          </div>
          <div className="text-slate-300">Percentile</div>
          <div className="text-sm text-slate-500 mt-1">Among all candidates</div>
        </div>
        
        <div className="text-center">
          <div className="text-xl font-bold text-green-400 mb-2">
            {results.industryIntel?.industryDetection?.secondary?.length || 0}
          </div>
          <div className="text-slate-300">Specializations</div>
          <div className="text-sm text-slate-500 mt-1">
            {results.industryIntel?.industryDetection?.secondary?.join(', ') || 'None'}
          </div>
        </div>
      </div>
    </div>

    {/* Market Position */}
    <div className={`bg-slate-800/50 backdrop-blur-lg rounded-2xl p-8 border border-slate-700/50 ${
      isVisible ? 'slide-in-right' : ''
    }`}>
      <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
        <BarChart3 className="w-8 h-8 text-blue-400" />
        Competitive Market Position
      </h3>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <h4 className="text-lg font-semibold text-white mb-4">Your Advantages</h4>
          <div className="space-y-3">
            {results.competitiveAnalysis?.competitorAnalysis?.yourAdvantages?.map((advantage: string, index: number) => (
              <div key={index} className={`flex items-start gap-3 p-3 bg-green-900/20 rounded-lg border border-green-500/30 ${
                isVisible ? 'bounce-in' : ''
              }`} style={{ animationDelay: `${index * 200}ms` }}>
                <div className="w-2 h-2 bg-green-400 rounded-full mt-2 flex-shrink-0"></div>
                <span className="text-green-100">{advantage}</span>
              </div>
            ))}
          </div>
        </div>
        
        <div>
          <h4 className="text-lg font-semibold text-white mb-4">Areas to Improve</h4>
          <div className="space-y-3">
            {results.competitiveAnalysis?.competitorAnalysis?.yourWeaknesses?.map((weakness: string, index: number) => (
              <div key={index} className={`flex items-start gap-3 p-3 bg-red-900/20 rounded-lg border border-red-500/30 ${
                isVisible ? 'bounce-in' : ''
              }`} style={{ animationDelay: `${index * 200}ms` }}>
                <div className="w-2 h-2 bg-red-400 rounded-full mt-2 flex-shrink-0"></div>
                <span className="text-red-100">{weakness}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>

    {/* Company Optimization (if available) */}
    {results.companyOptimization && (
      <div className={`bg-slate-800/50 backdrop-blur-lg rounded-2xl p-8 border border-slate-700/50 ${
        isVisible ? 'slide-in-left' : ''
      }`}>
        <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
          <Target className="w-8 h-8 text-pink-400" />
          Company-Specific Optimization
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-pink-400 mb-2">
              {results.companyOptimization.cultureAlignment}%
            </div>
            <div className="text-slate-300">Culture Alignment</div>
          </div>
          
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-400 mb-2">
              {results.companyOptimization.techStackMatch}%
            </div>
            <div className="text-slate-300">Tech Stack Match</div>
          </div>
          
          <div className="text-center">
            <div className="text-3xl font-bold text-green-400 mb-2">
              {results.companyOptimization.backgroundFit}%
            </div>
            <div className="text-slate-300">Background Fit</div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-slate-700/30 rounded-xl p-4">
            <h4 className="font-semibold text-white mb-3">Resume Adjustments</h4>
            <ul className="space-y-2">
              {results.companyOptimization.recommendations?.resumeAdjustments?.slice(0, 3).map((adjustment: string, index: number) => (
                <li key={index} className="text-sm text-slate-300 flex items-start gap-2">
                  <Lightbulb className="w-4 h-4 text-yellow-400 mt-0.5 flex-shrink-0" />
                  {adjustment}
                </li>
              ))}
            </ul>
          </div>
          
          <div className="bg-slate-700/30 rounded-xl p-4">
            <h4 className="font-semibold text-white mb-3">Interview Preparation</h4>
            <ul className="space-y-2">
              {results.companyOptimization.recommendations?.interviewPrep?.slice(0, 3).map((prep: string, index: number) => (
                <li key={index} className="text-sm text-slate-300 flex items-start gap-2">
                  <Calendar className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                  {prep}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    )}
  </motion.div>
);

// Strategy Tab Component
const StrategyTab: React.FC<{ results: any; isVisible: boolean }> = ({ results, isVisible }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -20 }}
    transition={{ duration: 0.5 }}
    className="space-y-6"
  >
    {/* Career Trajectory */}
    <div className={`bg-slate-800/50 backdrop-blur-lg rounded-2xl p-8 border border-slate-700/50 ${
      isVisible ? 'fade-in-up' : ''
    }`}>
      <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
        <TrendingUp className="w-8 h-8 text-green-400" />
        Career Growth Strategy
      </h3>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <h4 className="text-lg font-semibold text-white mb-4">Next Logical Roles</h4>
          <div className="space-y-4">
            {results.careerTrajectory?.nextLogicalRoles?.slice(0, 2).map((role: any, index: number) => (
              <div key={index} className={`p-4 bg-slate-700/30 rounded-lg border-l-4 ${
                index === 0 ? 'border-green-400' : 'border-blue-400'
              } ${isVisible ? 'slide-in-right' : ''}`} style={{ animationDelay: `${index * 300}ms` }}>
                <div className="flex justify-between items-center mb-2">
                  <span className={`font-medium ${index === 0 ? 'text-green-400' : 'text-blue-400'}`}>
                    {role.title}
                  </span>
                  <span className="text-sm text-slate-400">{role.timeframe}</span>
                </div>
                <div className="text-sm text-slate-300 mb-2">{role.probability}% probability</div>
                <div className="text-xs text-slate-400">
                  ${role.salaryRange?.[0]?.toLocaleString()} - ${role.salaryRange?.[1]?.toLocaleString()} expected range
                </div>
              </div>
            )) || [
              <div key={0} className="p-4 bg-slate-700/30 rounded-lg border-l-4 border-green-400">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium text-green-400">Senior Role</span>
                  <span className="text-sm text-slate-400">12-18 months</span>
                </div>
                <div className="text-sm text-slate-300 mb-2">75% probability</div>
                <div className="text-xs text-slate-400">$90k - $130k expected range</div>
              </div>,
              <div key={1} className="p-4 bg-slate-700/30 rounded-lg border-l-4 border-blue-400">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium text-blue-400">Leadership Role</span>
                  <span className="text-sm text-slate-400">2-3 years</span>
                </div>
                <div className="text-sm text-slate-300 mb-2">60% probability</div>
                <div className="text-xs text-slate-400">$120k - $160k expected range</div>
              </div>
            ]}
          </div>
        </div>
        
        <div>
          <h4 className="text-lg font-semibold text-white mb-4">Priority Skills to Develop</h4>
          <div className="space-y-3">
            {results.careerTrajectory?.skillGapsForPromotion?.slice(0, 3).map((skillGap: any, index: number) => (
              <div key={index} className={`p-3 rounded-lg border ${
                skillGap.importance === 'critical' ? 'bg-red-900/20 border-red-500/30' :
                skillGap.importance === 'important' ? 'bg-yellow-900/20 border-yellow-500/30' :
                'bg-blue-900/20 border-blue-500/30'
              } ${isVisible ? 'bounce-in' : ''}`} style={{ animationDelay: `${index * 300}ms` }}>
                <div className="flex justify-between items-center mb-1">
                  <span className={`font-medium ${
                    skillGap.importance === 'critical' ? 'text-red-100' :
                    skillGap.importance === 'important' ? 'text-yellow-100' :
                    'text-blue-100'
                  }`}>
                    {skillGap.skill}
                  </span>
                  <span className={`text-xs px-2 py-1 rounded ${
                    skillGap.importance === 'critical' ? 'text-red-400 bg-red-900/40' :
                    skillGap.importance === 'important' ? 'text-yellow-400 bg-yellow-900/40' :
                    'text-blue-400 bg-blue-900/40'
                  }`}>
                    {skillGap.importance?.toUpperCase()}
                  </span>
                </div>
                <div className={`text-sm ${
                  skillGap.importance === 'critical' ? 'text-red-200' :
                  skillGap.importance === 'important' ? 'text-yellow-200' :
                  'text-blue-200'
                }`}>
                  {skillGap.timeToAcquire} to acquire
                </div>
              </div>
            )) || [
              <div key={0} className="p-3 bg-red-900/20 rounded-lg border border-red-500/30">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-red-100 font-medium">Leadership Skills</span>
                  <span className="text-xs text-red-400 bg-red-900/40 px-2 py-1 rounded">CRITICAL</span>
                </div>
                <div className="text-sm text-red-200">12-18 months to acquire</div>
              </div>,
              <div key={1} className="p-3 bg-yellow-900/20 rounded-lg border border-yellow-500/30">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-yellow-100 font-medium">Strategic Thinking</span>
                  <span className="text-xs text-yellow-400 bg-yellow-900/40 px-2 py-1 rounded">IMPORTANT</span>
                </div>
                <div className="text-sm text-yellow-200">6-12 months to acquire</div>
              </div>
            ]}
          </div>
        </div>
      </div>
    </div>

    {/* Action Plan */}
    <div className={`bg-slate-800/50 backdrop-blur-lg rounded-2xl p-8 border border-slate-700/50 ${
      isVisible ? 'slide-in-left' : ''
    }`}>
      <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
        <Target className="w-8 h-8 text-purple-400" />
        Strategic Action Plan
      </h3>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <h4 className="text-lg font-semibold text-white mb-4">Short-term (1-2 years)</h4>
          <div className="space-y-3">
            {(results.careerTrajectory?.careerStrategies?.shortTerm || [
              "Develop leadership skills through mentoring",
              "Take on larger project responsibilities",
              "Build cross-functional relationships",
              "Pursue relevant certifications"
            ]).map((action: string, index: number) => (
              <div key={index} className={`flex items-start gap-3 p-3 bg-blue-900/20 rounded-lg ${
                isVisible ? 'slide-in-right' : ''
              }`} style={{ animationDelay: `${index * 200}ms` }}>
                <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-bold mt-0.5">
                  {index + 1}
                </div>
                <span className="text-blue-100">{action}</span>
              </div>
            ))}
          </div>
        </div>
        
        <div>
          <h4 className="text-lg font-semibold text-white mb-4">Long-term (3-5 years)</h4>
          <div className="space-y-3">
            {(results.careerTrajectory?.careerStrategies?.longTerm || [
              "Build strategic business acumen",
              "Develop industry thought leadership",
              "Consider advanced education or specialization",
              "Explore entrepreneurial opportunities"
            ]).map((action: string, index: number) => (
              <div key={index} className={`flex items-start gap-3 p-3 bg-purple-900/20 rounded-lg ${
                isVisible ? 'slide-in-left' : ''
              }`} style={{ animationDelay: `${index * 200}ms` }}>
                <div className="w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center text-white text-sm font-bold mt-0.5">
                  {index + 1}
                </div>
                <span className="text-purple-100">{action}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>

    {/* Export Options */}
    <div className="text-center">
      <div className="bg-slate-800/50 backdrop-blur-lg rounded-2xl p-6 border border-slate-700/50 inline-block">
        <h4 className="text-lg font-semibold text-white mb-4">Export Your Intelligence Report</h4>
        <div className="flex gap-4 justify-center">
          <button className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl text-white font-medium hover:shadow-lg transition-all duration-300 hover:scale-105">
            Download PDF Report
          </button>
          <button className="px-6 py-3 bg-slate-700 rounded-xl text-white font-medium hover:bg-slate-600 transition-all duration-300 hover:scale-105">
            Share Results
          </button>
        </div>
      </div>
    </div>
  </motion.div>
);

export default AdvancedResultsDashboard;
