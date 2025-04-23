import { useState, useEffect, useCallback } from "react";
import axios, { AxiosRequestConfig, AxiosResponse, AxiosError } from "axios";
import { useLoading } from "@/components/ui/loading-spinner";

interface UseAxiosOptions {
  manual?: boolean;
  showLoading?: boolean;
  loadingOptions?: {
    size?: "sm" | "md" | "lg";
    ballColor?: string;
  };
}

interface AxiosState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

function useAxios<T = any>(
  url: string,
  config: AxiosRequestConfig = {},
  options: UseAxiosOptions = { manual: false, showLoading: true }
) {
  const [state, setState] = useState<AxiosState<T>>({
    data: null,
    loading: false,
    error: null,
  });

  const { showLoading, hideLoading } = useLoading();

  const fetchData = useCallback(
    async (overrideConfig: AxiosRequestConfig = {}) => {
      setState((prev) => ({ ...prev, loading: true, error: null }));

      // Show global loading if enabled
      if (options.showLoading) {
        showLoading(options.loadingOptions);
      }

      try {
        const response: AxiosResponse<T> = await axios({
          url,
          ...config,
          ...overrideConfig,
        });

        setState({
          data: response.data,
          loading: false,
          error: null,
        });

        return response;
      } catch (error) {
        const axiosError = error as AxiosError;
        const errorMessage = axiosError.response?.data?.message || axiosError.message || "An error occurred";

        setState({
          data: null,
          loading: false,
          error: errorMessage,
        });

        throw error;
      } finally {
        if (options.showLoading) {
          hideLoading();
        }
      }
    },
    [url, config, options.showLoading, showLoading, hideLoading, options.loadingOptions]
  );

  // Auto-fetch if not manual
  useEffect(() => {
    if (!options.manual) {
      fetchData();
    }
  }, [fetchData, options.manual]);

  return {
    ...state,
    refetch: fetchData,
  };
}

export default useAxios; 