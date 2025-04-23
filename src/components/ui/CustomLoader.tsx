import React from 'react';
import './CustomLoader.css';

interface CustomLoaderProps {
  size?: 'sm' | 'md' | 'lg';
  color?: string;
  className?: string;
}

const CustomLoader: React.FC<CustomLoaderProps> = ({
  size = 'md',
  color,
  className = '',
}) => {
  // Scale factor based on size
  const sizeMultipliers = {
    sm: 0.75,
    md: 1,
    lg: 1.5,
  };

  const scaleFactor = sizeMultipliers[size];
  
  const style = {
    '--scale-factor': scaleFactor,
    '--square-color': color || 'var(--primary)',
  } as React.CSSProperties;

  return (
    <div className={`flex justify-center items-center p-4 ${className}`}>
      <div className="loadingspinner" style={style}>
        <div id="square1"></div>
        <div id="square2"></div>
        <div id="square3"></div>
        <div id="square4"></div>
        <div id="square5"></div>
      </div>
    </div>
  );
};

export { CustomLoader };
