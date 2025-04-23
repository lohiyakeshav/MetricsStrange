import { CircleLoader } from "./circle-loader";
import { cn } from "@/lib/utils";

export interface SimpleLoaderProps {
  size?: "xs" | "sm" | "md" | "lg";
  color?: string;
  className?: string;
}

export function SimpleLoader({ size = "md", color, className = "" }: SimpleLoaderProps) {
  return (
    <CircleLoader 
      size={size}
      color={color}
      className={cn(className)}
    />
  );
} 