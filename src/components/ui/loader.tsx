import React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

export const loaderVariants = cva(
  "relative inline-block",
  {
    variants: {
      size: {
        sm: "w-12 h-16",
        md: "w-16 h-24",
        lg: "w-24 h-32",
      },
    },
    defaultVariants: {
      size: "md",
    },
  }
);

export interface LoaderProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof loaderVariants> {
  ballColor?: string;
}

const Loader = ({ className, size, ballColor = "#3498db", ...props }: LoaderProps) => {
  return (
    <div className={cn(loaderVariants({ size }), className)} {...props}>
      <div className="loader relative w-full h-full">
        <div 
          className="absolute bottom-0 w-[10%] h-1/2 bg-black dark:bg-white origin-bottom shadow-sm" 
          style={{ 
            left: "0%", 
            transform: "scale(1, 0.2)", 
            animation: "barUp1 4s infinite" 
          }}
        ></div>
        <div 
          className="absolute bottom-0 w-[10%] h-1/2 bg-black dark:bg-white origin-bottom shadow-sm" 
          style={{ 
            left: "20%", 
            transform: "scale(1, 0.4)", 
            animation: "barUp2 4s infinite" 
          }}
        ></div>
        <div 
          className="absolute bottom-0 w-[10%] h-1/2 bg-black dark:bg-white origin-bottom shadow-sm" 
          style={{ 
            left: "40%", 
            transform: "scale(1, 0.6)", 
            animation: "barUp3 4s infinite" 
          }}
        ></div>
        <div 
          className="absolute bottom-0 w-[10%] h-1/2 bg-black dark:bg-white origin-bottom shadow-sm" 
          style={{ 
            left: "60%", 
            transform: "scale(1, 0.8)", 
            animation: "barUp4 4s infinite" 
          }}
        ></div>
        <div 
          className="absolute bottom-0 w-[10%] h-1/2 bg-black dark:bg-white origin-bottom shadow-sm" 
          style={{ 
            left: "80%", 
            transform: "scale(1, 1)", 
            animation: "barUp5 4s infinite" 
          }}
        ></div>
        <div 
          className="absolute rounded-full w-[10%] h-[10%] bottom-[10%] left-0" 
          style={{ 
            backgroundColor: ballColor, 
            animation: "ball624 4s infinite"
          }}
        ></div>
      </div>
    </div>
  );
};

Loader.displayName = "Loader";

export { Loader }; 