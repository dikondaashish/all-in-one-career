'use client';

import { Check, Loader2 } from 'lucide-react';

interface ScanningStep {
  id: number;
  title: string;
  description: string;
}

const SCANNING_STEPS: ScanningStep[] = [
  { id: 1, title: "Uploading resume", description: "Analyzing file format and structure..." },
  { id: 2, title: "Parsing content", description: "Extracting text and identifying sections..." },
  { id: 3, title: "Analyzing skills", description: "Identifying technical and soft skills..." },
  { id: 4, title: "Checking format", description: "Evaluating ATS compatibility..." },
  { id: 5, title: "Generating report", description: "Creating detailed analysis and insights..." }
];

interface ScanningProgressProps {
  currentStep: number;
  progress: number;
  isVisible: boolean;
  onCancel?: () => void;
}

export const ScanningProgress = ({ currentStep, progress, isVisible, onCancel }: ScanningProgressProps) => {
  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl p-8 max-w-md w-full mx-4 shadow-2xl">
        <div className="text-center mb-6">
          {/* Circular Progress Indicator */}
          <div className="w-20 h-20 mx-auto mb-4 relative">
            {/* Background circle */}
            <svg className="w-20 h-20 transform -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50" cy="50" r="40"
                fill="none" stroke="currentColor"
                strokeWidth="8"
                className="text-gray-200 dark:text-gray-600"
              />
              <circle
                cx="50" cy="50" r="40"
                fill="none" stroke="currentColor"
                strokeWidth="8"
                strokeDasharray={`${2.51 * progress} 251`}
                className="text-blue-600 transition-all duration-500 ease-out"
                strokeLinecap="round"
              />
            </svg>
            
            {/* Progress percentage */}
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-lg font-bold text-gray-900 dark:text-white">
                {Math.round(progress)}%
              </span>
            </div>
          </div>
          
          {/* Current step info */}
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            {SCANNING_STEPS[currentStep - 1]?.title || 'Processing...'}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            {SCANNING_STEPS[currentStep - 1]?.description || 'Please wait...'}
          </p>
          
          {/* Overall Progress Bar */}
          <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2 mb-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Step {currentStep} of {SCANNING_STEPS.length} • {Math.round(progress)}% Complete
          </p>
        </div>
        
        {/* Steps List */}
        <div className="space-y-3">
          {SCANNING_STEPS.map((step, index) => {
            const stepNumber = index + 1;
            const isCompleted = stepNumber < currentStep;
            const isCurrent = stepNumber === currentStep;
            
            return (
              <div 
                key={step.id}
                className={`flex items-center text-sm p-3 rounded-lg transition-all duration-300 ${
                  isCompleted 
                    ? 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20' 
                    : isCurrent 
                    ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20' 
                    : 'text-gray-400 dark:text-gray-500'
                }`}
              >
                <div className="flex-shrink-0 mr-3">
                  {isCompleted ? (
                    <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                      <Check className="w-3 h-3 text-white" />
                    </div>
                  ) : isCurrent ? (
                    <div className="w-5 h-5 border-2 border-blue-500 rounded-full flex items-center justify-center">
                      <Loader2 className="w-3 h-3 text-blue-500 animate-spin" />
                    </div>
                  ) : (
                    <div className="w-5 h-5 border-2 border-gray-300 dark:border-gray-600 rounded-full flex items-center justify-center">
                      <span className="text-xs font-medium">{stepNumber}</span>
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <div className="font-medium">{step.title}</div>
                  {isCurrent && (
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {step.description}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Cancel Button (Optional) */}
        {onCancel && (
          <div className="mt-6 text-center">
            <button 
              onClick={onCancel}
              className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
            >
              Cancel Scan
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ScanningProgress;
