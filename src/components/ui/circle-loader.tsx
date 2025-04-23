import React from "react";
import { cn } from "@/lib/utils";

interface CircleLoaderProps {
  size?: 'xs' | 'sm' | 'md' | 'lg';
  color?: string;
  className?: string;
  strokeWidth?: number;
}

export function CircleLoader({ 
  size = 'md', 
  color,
  strokeWidth = 2,
  className 
}: CircleLoaderProps) {
  const sizeMap = {
    xs: 16,
    sm: 24,
    md: 36,
    lg: 48,
  };

  const dimension = sizeMap[size];
  const viewBoxSize = dimension + strokeWidth;
  const center = viewBoxSize / 2;
  const radius = (dimension - strokeWidth) / 2;
  
  return (
    <div className={cn("flex items-center justify-center", className)}>
      <svg 
        width={dimension} 
        height={dimension} 
        viewBox={`0 0 ${viewBoxSize} ${viewBoxSize}`}
        className="animate-spin"
      >
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          stroke="currentColor"
          opacity={0.2}
          className="text-muted-foreground"
        />
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          stroke={color || "currentColor"}
          strokeLinecap="round"
          className={!color ? "text-primary" : undefined}
          strokeDasharray={2 * Math.PI * radius}
          strokeDashoffset={2 * Math.PI * radius * 0.75}
        />
      </svg>
    </div>
  );
}

CircleLoader.displayName = "CircleLoader"; 