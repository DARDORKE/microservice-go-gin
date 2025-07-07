import React from 'react';
import './Loader.css';

interface LoaderProps {
  size?: 'small' | 'medium' | 'large';
  color?: string;
  text?: string;
  inline?: boolean;
  overlay?: boolean;
}

const Loader: React.FC<LoaderProps> = ({
  size = 'medium',
  color = 'var(--primary-color)',
  text,
  inline = false,
  overlay = false
}) => {
  const sizeClasses = {
    small: 'loader-small',
    medium: 'loader-medium',
    large: 'loader-large'
  };

  const loaderClass = `loader ${sizeClasses[size]} ${inline ? 'loader-inline' : ''}`;
  const containerClass = `loader-container ${overlay ? 'loader-overlay' : ''}`;

  return (
    <div className={containerClass}>
      <div className={loaderClass}>
        <div
          className="spinner"
          style={{ borderTopColor: color }}
        ></div>
        {text && <span className="loader-text">{text}</span>}
      </div>
    </div>
  );
};

export default Loader;