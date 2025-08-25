/**
 * Loading Analysis Component - Animated loading screen during ATS analysis
 */

import React, { useState, useEffect } from 'react';
import { 
  Brain, 
  Search, 
  Target, 
  TrendingUp, 
  Users, 
  CheckCircle,
  Zap,
  BarChart3,
  FileText,
  Award
} from 'lucide-react';

interface LoadingAnalysisProps {
  isVisible: boolean;
}

export const LoadingAnalysis: React.FC<LoadingAnalysisProps> = ({ isVisible }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);

  const analysisSteps = [
    {
      id: 0,
      icon: FileText,
      title: "ATS Foundation Check",
      description: "Analyzing file format, contact info, and basic structure",
      duration: 2000
    },
    {
      id: 1,
      icon: Brain,
      title: "AI Skills Analysis",
      description: "Extracting and categorizing hard/soft/transferable skills",
      duration: 3000
    },
    {
      id: 2,
      icon: Users,
      title: "Recruiter Psychology",
      description: "Evaluating 6-second impression and narrative coherence",
      duration: 2500
    },
    {
      id: 3,
      icon: TrendingUp,
      title: "Market Intelligence",
      description: "Detecting industry trends and market positioning",
      duration: 3500
    },
    {
      id: 4,
      icon: Target,
      title: "Company Optimization",
      description: "Analyzing company-specific alignment and culture fit",
      duration: 2000
    },
    {
      id: 5,
      icon: BarChart3,
      title: "Predictive Analysis",
      description: "Calculating hire probability and future growth potential",
      duration: 2500
    }
  ];

  useEffect(() => {
    if (!isVisible) {
      setCurrentStep(0);
      setCompletedSteps([]);
      return;
    }

    let stepIndex = 0;
    let totalElapsed = 0;

    const progressSteps = () => {
      if (stepIndex < analysisSteps.length) {
        setCurrentStep(stepIndex);
        
        const stepDuration = analysisSteps[stepIndex].duration;
        
        setTimeout(() => {
          setCompletedSteps(prev => [...prev, stepIndex]);
          stepIndex++;
          totalElapsed += stepDuration;
          
          if (stepIndex < analysisSteps.length) {
            setTimeout(progressSteps, 500); // Brief pause between steps
          }
        }, stepDuration);
      }
    };

    progressSteps();
  }, [isVisible]);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full mb-4">
            <Brain className="w-8 h-8 text-white animate-pulse" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Advanced AI Analysis</h2>
          <p className="text-gray-600">
            Running comprehensive ATS intelligence scan with market insights
          </p>
        </div>

        {/* Progress Steps */}
        <div className="space-y-4 mb-8">
          {analysisSteps.map((step, index) => {
            const Icon = step.icon;
            const isActive = currentStep === index;
            const isCompleted = completedSteps.includes(index);
            const isUpcoming = index > currentStep;

            return (
              <div
                key={step.id}
                className={`flex items-center space-x-4 p-4 rounded-lg border-2 transition-all duration-500 ${
                  isActive
                    ? 'border-blue-500 bg-blue-50 scale-105'
                    : isCompleted
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-200 bg-gray-50'
                }`}
              >
                <div
                  className={`flex items-center justify-center w-12 h-12 rounded-full transition-all duration-500 ${
                    isActive
                      ? 'bg-blue-600 text-white animate-spin'
                      : isCompleted
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-300 text-gray-500'
                  }`}
                >
                  {isCompleted ? (
                    <CheckCircle className="w-6 h-6" />
                  ) : isActive ? (
                    <Icon className="w-6 h-6 animate-pulse" />
                  ) : (
                    <Icon className="w-6 h-6" />
                  )}
                </div>
                
                <div className="flex-1">
                  <h3
                    className={`font-semibold transition-colors duration-300 ${
                      isActive ? 'text-blue-900' : isCompleted ? 'text-green-900' : 'text-gray-700'
                    }`}
                  >
                    {step.title}
                  </h3>
                  <p
                    className={`text-sm transition-colors duration-300 ${
                      isActive ? 'text-blue-700' : isCompleted ? 'text-green-700' : 'text-gray-500'
                    }`}
                  >
                    {step.description}
                  </p>
                </div>

                {isActive && (
                  <div className="flex items-center space-x-2">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                      <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                      <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                    </div>
                  </div>
                )}

                {isCompleted && (
                  <div className="text-green-600">
                    <Zap className="w-5 h-5" />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* AI Insights Preview */}
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-6 border border-purple-200">
          <div className="flex items-center space-x-3 mb-4">
            <Award className="w-6 h-6 text-purple-600" />
            <h3 className="font-semibold text-purple-900">AI Intelligence Preview</h3>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="text-center p-3 bg-white rounded-lg border border-purple-100">
              <div className="text-2xl font-bold text-purple-600 mb-1">95+</div>
              <div className="text-purple-700">Data Points</div>
            </div>
            <div className="text-center p-3 bg-white rounded-lg border border-purple-100">
              <div className="text-2xl font-bold text-purple-600 mb-1">8</div>
              <div className="text-purple-700">AI Engines</div>
            </div>
            <div className="text-center p-3 bg-white rounded-lg border border-purple-100">
              <div className="text-2xl font-bold text-purple-600 mb-1">360°</div>
              <div className="text-purple-700">Analysis</div>
            </div>
            <div className="text-center p-3 bg-white rounded-lg border border-purple-100">
              <div className="text-2xl font-bold text-purple-600 mb-1">Real-time</div>
              <div className="text-purple-700">Insights</div>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-6">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>Analysis Progress</span>
            <span>{Math.round(((completedSteps.length + (currentStep < analysisSteps.length ? 0.5 : 0)) / analysisSteps.length) * 100)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className="bg-gradient-to-r from-blue-600 to-purple-600 h-3 rounded-full transition-all duration-1000 ease-out"
              style={{
                width: `${((completedSteps.length + (currentStep < analysisSteps.length ? 0.5 : 0)) / analysisSteps.length) * 100}%`
              }}
            ></div>
          </div>
        </div>

        {completedSteps.length === analysisSteps.length && (
          <div className="mt-6 text-center">
            <div className="inline-flex items-center space-x-2 text-green-600 font-semibold">
              <CheckCircle className="w-5 h-5" />
              <span>Analysis Complete! Preparing results...</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
