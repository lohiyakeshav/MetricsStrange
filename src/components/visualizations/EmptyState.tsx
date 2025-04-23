import React from "react";
import { SimpleLoader } from "@/components/ui/simple-loader";
import { Button } from "@/components/ui/button";
import { RefreshCw, AlertCircle, Clock } from "lucide-react";

interface EmptyStateProps {
  title: string;
  message: string;
  icon?: "loading" | "error" | "empty" | "processing";
  onRetry?: () => void;
}

const EmptyState: React.FC<EmptyStateProps> = ({ 
  title, 
  message, 
  icon = "empty",
  onRetry 
}) => {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="mb-6">
        {icon === "loading" && <SimpleLoader size="lg" />}
        
        {icon === "error" && (
          <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
            <AlertCircle className="h-8 w-8 text-destructive" />
          </div>
        )}
        
        {icon === "empty" && (
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              width="32" 
              height="32" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              className="text-muted-foreground"
            >
              <path d="M21 6H3" />
              <path d="M10 12H3" />
              <path d="M10 18H3" />
              <path d="M18 12h.01" />
              <path d="M18 18h.01" />
            </svg>
          </div>
        )}
        
        {icon === "processing" && (
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            <Clock className="h-8 w-8 text-primary animate-pulse" />
          </div>
        )}
      </div>
      
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-muted-foreground max-w-md mb-6">{message}</p>
      
      {onRetry && (
        <Button 
          variant="outline" 
          onClick={onRetry}
          className="flex items-center gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Try Again
        </Button>
      )}
    </div>
  );
};

export { EmptyState }; 