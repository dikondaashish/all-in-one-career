interface ProgressRingProps {
  progress: number; // 0-100
  size?: number;
  strokeWidth?: number;
  color?: string;
  backgroundColor?: string;
  className?: string;
  showPercentage?: boolean;
}

export const ProgressRing = ({ 
  progress, 
  size = 120, 
  strokeWidth = 8,
  color = 'text-blue-600',
  backgroundColor = 'text-gray-200 dark:text-gray-600',
  className = '',
  showPercentage = true
}: ProgressRingProps) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (progress / 100) * circumference;
  
  return (
    <div className={`relative ${className}`} style={{ width: size, height: size }}>
      <svg 
        width={size} 
        height={size} 
        className="transform -rotate-90"
        viewBox={`0 0 ${size} ${size}`}
      >
        {/* Background circle */}
        <circle
          cx={size / 2} 
          cy={size / 2} 
          r={radius}
          fill="none" 
          stroke="currentColor" 
          strokeWidth={strokeWidth}
          className={backgroundColor}
        />
        {/* Progress circle */}
        <circle
          cx={size / 2} 
          cy={size / 2} 
          r={radius}
          fill="none" 
          stroke="currentColor" 
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className={`transition-all duration-500 ease-out ${color}`}
        />
      </svg>
      
      {showPercentage && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`text-2xl font-bold ${color.replace('text-', 'text-').replace('dark:', '')}`}>
            {Math.round(progress)}%
          </span>
        </div>
      )}
    </div>
  );
};

export default ProgressRing;
