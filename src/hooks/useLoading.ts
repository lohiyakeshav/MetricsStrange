import { useState, useCallback } from 'react';

interface UseLoadingOptions {
  initialState?: boolean;
  minLoadingTime?: number;
}

export function useLoading(options: UseLoadingOptions = {}) {
  const { initialState = false, minLoadingTime = 300 } = options;
  const [isLoading, setIsLoading] = useState(initialState);
  const [isProcessing, setIsProcessing] = useState(false);
  const [loadingStartTime, setLoadingStartTime] = useState<number | null>(null);

  const startLoading = useCallback(() => {
    setIsLoading(true);
    setLoadingStartTime(Date.now());
  }, []);

  const stopLoading = useCallback(() => {
    // If we have a minimum loading time, make sure we respect it
    if (loadingStartTime && minLoadingTime > 0) {
      const elapsed = Date.now() - loadingStartTime;
      if (elapsed < minLoadingTime) {
        setTimeout(() => {
          setIsLoading(false);
          setLoadingStartTime(null);
        }, minLoadingTime - elapsed);
        return;
      }
    }
    
    setIsLoading(false);
    setLoadingStartTime(null);
  }, [loadingStartTime, minLoadingTime]);

  const startProcessing = useCallback(() => {
    setIsProcessing(true);
  }, []);

  const stopProcessing = useCallback(() => {
    setIsProcessing(false);
  }, []);

  const withLoading = useCallback(async <T,>(promise: Promise<T>, customMinTime?: number): Promise<T> => {
    const minTime = customMinTime ?? minLoadingTime;
    const start = Date.now();
    
    try {
      startLoading();
      const result = await promise;
      
      // Ensure minimum loading time to prevent flickering
      const elapsed = Date.now() - start;
      if (elapsed < minTime) {
        await new Promise(resolve => setTimeout(resolve, minTime - elapsed));
      }
      
      return result;
    } finally {
      stopLoading();
    }
  }, [startLoading, stopLoading, minLoadingTime]);

  const withProcessing = useCallback(async <T,>(promise: Promise<T>): Promise<T> => {
    try {
      startProcessing();
      return await promise;
    } finally {
      stopProcessing();
    }
  }, [startProcessing, stopProcessing]);

  return {
    isLoading,
    isProcessing,
    startLoading,
    stopLoading,
    startProcessing,
    stopProcessing,
    withLoading,
    withProcessing,
    setMinLoadingTime: (time: number) => options.minLoadingTime = time,
  };
} 