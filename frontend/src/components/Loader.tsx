import React from 'react';

interface LoaderProps {
  size?: 'small' | 'medium' | 'large';
  color?: string;
  text?: string;
  inline?: boolean;
  overlay?: boolean;
}

const Loader: React.FC<LoaderProps> = ({
  size = 'medium',
  color = '#0ea5e9',
  text,
  inline = false,
  overlay = false
}) => {
  const sizeClasses = {
    small: 'w-4 h-4',
    medium: 'w-8 h-8',
    large: 'w-12 h-12'
  };

  const textSizeClasses = {
    small: 'text-sm',
    medium: 'text-base',
    large: 'text-lg'
  };

  const containerClasses = overlay 
    ? 'fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50'
    : inline 
    ? 'inline-flex items-center gap-2'
    : 'flex flex-col items-center justify-center gap-3';

  return (
    <div className={containerClasses}>
      <div className="relative">
        {/* Spinning circle */}
        <div 
          className={`${sizeClasses[size]} border-2 border-gray-200 border-t-current rounded-full animate-spin`}
          style={{ color }}
        />
        
        {/* Gradient accent */}
        <div 
          className={`absolute inset-0 ${sizeClasses[size]} border-2 border-transparent border-t-current rounded-full animate-spin opacity-40`}
          style={{ 
            color,
            animationDuration: '1.5s',
            animationDirection: 'reverse'
          }}
        />
      </div>
      
      {text && (
        <span 
          className={`${textSizeClasses[size]} font-medium text-gray-600 ${inline ? '' : 'mt-2'}`}
        >
          {text}
        </span>
      )}
    </div>
  );
};

export default Loader;