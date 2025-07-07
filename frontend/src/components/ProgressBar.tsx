import React from 'react';

interface ProgressBarProps {
  percentage: number;
  className?: string;
  animated?: boolean;
  size?: 'sm' | 'md' | 'lg';
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'auto';
  showLabel?: boolean;
}

const ProgressBar: React.FC<ProgressBarProps> = ({
  percentage,
  className = '',
  animated = true,
  size = 'md',
  color = 'auto',
  showLabel = false
}) => {
  const sizeClasses = {
    sm: 'h-2',
    md: 'h-3',
    lg: 'h-5'
  };

  const colorClasses = {
    primary: 'from-blue-500 to-cyan-500',
    secondary: 'from-green-500 to-emerald-500',
    success: 'from-green-400 to-green-600',
    warning: 'from-yellow-400 to-orange-500',
    danger: 'from-red-400 to-red-600',
    auto: ''
  };

  const clampedPercentage = Math.min(Math.max(percentage, 0), 100);
  
  // Auto color based on percentage
  const getAutoColor = () => {
    if (clampedPercentage >= 70) return 'from-green-400 via-green-500 to-emerald-600';
    if (clampedPercentage >= 40) return 'from-blue-400 via-blue-500 to-cyan-600';
    if (clampedPercentage >= 20) return 'from-yellow-400 via-orange-500 to-orange-600';
    return 'from-red-400 via-red-500 to-red-600';
  };

  const finalColorClass = color === 'auto' ? getAutoColor() : colorClasses[color];
  const animationClass = animated ? 'transition-all duration-1000 ease-out' : '';

  return (
    <div className={`relative ${className}`}>
      {/* Background track */}
      <div className={`w-full bg-gray-200 rounded-full overflow-hidden ${sizeClasses[size]} shadow-inner`}>
        {/* Progress fill */}
        <div
          className={`
            ${sizeClasses[size]} 
            bg-gradient-to-r 
            ${finalColorClass}
            rounded-full 
            ${animationClass}
            relative
            overflow-hidden
            shadow-sm
          `}
          style={{ 
            width: `${clampedPercentage}%`,
            transition: animated ? 'width 1s cubic-bezier(0.4, 0, 0.2, 1)' : 'none'
          }}
        >
          {/* Shimmer effect */}
          {animated && clampedPercentage > 0 && (
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent opacity-60">
              <div className="h-full w-full animate-pulse bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
            </div>
          )}
          
          {/* Glow effect */}
          {clampedPercentage > 0 && (
            <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-50"></div>
          )}
        </div>
      </div>
      
      {/* Optional label */}
      {showLabel && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xs font-bold text-white drop-shadow-sm">
            {clampedPercentage.toFixed(1)}%
          </span>
        </div>
      )}
    </div>
  );
};

export default ProgressBar;