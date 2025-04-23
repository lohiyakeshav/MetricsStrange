import React, { createContext, useContext, useState, useEffect } from "react";
import { Loader } from "./loader";
import { SimpleLoader } from "./simple-loader";
import { setGlobalLoadingContext } from "@/services/api";

// Define the context type
interface LoadingContextType {
  isLoading: boolean;
  setLoading: (isLoading: boolean) => void;
  showLoading: (options?: LoadingOptions) => void;
  hideLoading: () => void;
}

interface LoadingOptions {
  size?: "sm" | "md" | "lg";
  ballColor?: string;
  useSimpleLoader?: boolean;
}

// Create the context with default values
const LoadingContext = createContext<LoadingContextType>({
  isLoading: false,
  setLoading: () => {},
  showLoading: () => {},
  hideLoading: () => {},
});

// Custom hook to use the loading context
export const useLoading = () => useContext(LoadingContext);

// Props for the provider component
interface LoadingProviderProps {
  children: React.ReactNode;
}

export const LoadingProvider: React.FC<LoadingProviderProps> = ({ children }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [options, setOptions] = useState<LoadingOptions>({
    size: "md",
    ballColor: "#3498db",
    useSimpleLoader: false
  });

  // Function to show the loading spinner with options
  const showLoading = (newOptions?: LoadingOptions) => {
    if (newOptions) {
      setOptions({ ...options, ...newOptions });
    }
    setIsLoading(true);
  };

  // Function to hide the loading spinner
  const hideLoading = () => {
    setIsLoading(false);
  };

  // Create the context value
  const contextValue = {
    isLoading,
    setLoading: setIsLoading,
    showLoading,
    hideLoading,
  };

  // Set the global loading context for use outside of React components
  useEffect(() => {
    setGlobalLoadingContext(contextValue);
  }, [contextValue]);

  return (
    <LoadingContext.Provider value={contextValue}>
      {children}
      {isLoading && (
        <div className="fixed bottom-4 right-4 z-[9999] px-4 py-2 bg-background/90 dark:bg-gray-800/90 rounded-md shadow-lg border border-border flex items-center gap-2">
          {options.useSimpleLoader ? (
            <SimpleLoader size={options.size as "sm" | "md" | "lg"} color={options.ballColor} />
          ) : (
            <Loader size={options.size} ballColor={options.ballColor} />
          )}
          <span className="text-sm font-medium">Loading...</span>
        </div>
      )}
    </LoadingContext.Provider>
  );
};

// Loading overlay component
interface LoadingOverlayProps {
  size?: "sm" | "md" | "lg";
  ballColor?: string;
  useSimpleLoader?: boolean;
}

const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ 
  size = "md", 
  ballColor = "#3498db",
  useSimpleLoader = false 
}) => {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-white/70 dark:bg-black/70 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-8 shadow-2xl">
        {useSimpleLoader ? (
          <SimpleLoader size={size} color={ballColor} />
        ) : (
          <Loader size={size} ballColor={ballColor} />
        )}
      </div>
    </div>
  );
};

// Export a standalone spinner that can be used directly
export const LoadingSpinner: React.FC<LoadingOverlayProps> = ({ 
  size, 
  ballColor,
  useSimpleLoader = false 
}) => (
  <div className="flex justify-center items-center p-4">
    {useSimpleLoader ? (
      <SimpleLoader size={size} color={ballColor} />
    ) : (
      <Loader size={size} ballColor={ballColor} />
    )}
  </div>
); 