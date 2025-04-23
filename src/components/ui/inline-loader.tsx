import React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

export const inlineLoaderVariants = cva(
  "relative inline-flex items-center justify-center",
  {
    variants: {
      size: {
        xs: "w-16 h-16",
        sm: "w-24 h-24",
        md: "w-32 h-32",
        lg: "w-40 h-40",
      },
      variant: {
        spinner: "animate-spin rounded-full border-4 border-muted",
        dots: "gap-1",
        pulse: "animate-pulse",
      },
    },
    defaultVariants: {
      size: "md",
      variant: "spinner",
    },
  }
);

export interface InlineLoaderProps extends React.HTMLAttributes<HTMLDivElement>, 
  VariantProps<typeof inlineLoaderVariants> {
  accent?: string;
  fullWidth?: boolean;
  overlay?: boolean;
}

export const InlineLoader = ({ 
  className, 
  size, 
  variant,
  accent = "var(--primary)", 
  fullWidth = false,
  overlay = false,
  ...props 
}: InlineLoaderProps) => {
  const loaderContent = () => {
    switch (variant) {
      case "spinner":
        return (
          <div 
            className={cn(
              inlineLoaderVariants({ size, variant }),
              "border-t-primary"
            )}
            style={{ borderTopColor: accent }}
          />
        );
      case "dots":
        return (
          <div className={cn(inlineLoaderVariants({ size, variant }))}>
            {[1, 2, 3].map((i) => (
              <div 
                key={i}
                className="w-2 h-2 rounded-full animate-bounce"
                style={{ 
                  backgroundColor: accent,
                  animationDelay: `${(i - 1) * 0.1}s`,
                  animationDuration: "0.6s"
                }}
              />
            ))}
          </div>
        );
      case "pulse":
        return (
          <div 
            className={cn(inlineLoaderVariants({ size, variant }))}
            style={{ backgroundColor: accent, opacity: 0.3 }}
          />
        );
      default:
        return (
          <div 
            className={cn(inlineLoaderVariants({ size, variant: "spinner" }))}
            style={{ borderTopColor: accent }}
          />
        );
    }
  };

  return (
    <div 
      className={cn(
        "flex items-center justify-center p-4",
        fullWidth && "w-full",
        overlay && "absolute inset-0 bg-background bg-opacity-70 z-10",
        className
      )} 
      {...props}
    >
      {loaderContent()}
    </div>
  );
};

InlineLoader.displayName = "InlineLoader"; 