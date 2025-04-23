import { useLoading } from "@/components/ui/loading-spinner";

// Determine the API URL based on environment
const isDevelopment = import.meta.env.DEV;
let API_BASE_URL;

try {
  // Get the API URL from environment variables
  const envApiUrl = import.meta.env.VITE_API_URL;
  
  if (isDevelopment) {
    // Development environment - use localhost unless specifically overridden
    API_BASE_URL = envApiUrl || "http://localhost:8000";
    console.log(`Development environment - using API URL: ${API_BASE_URL}`);
  } else {
    // Production environment - use environment variable with fallback
    API_BASE_URL = envApiUrl || "https://strangemetrics.onrender.com";
    console.log(`Production environment - using API URL: ${API_BASE_URL}`);
  }
} catch (error) {
  console.error('Error initializing API_BASE_URL:', error);
  // Fallback to a safe default based on environment
  API_BASE_URL = isDevelopment 
    ? 'http://localhost:8000' 
    : 'https://strangemetrics.onrender.com';
  console.log(`Using fallback API URL: ${API_BASE_URL}`);
}

// Setup a store for the loading context
let globalLoadingContext: ReturnType<typeof useLoading> | null = null;

// Function to set the loading context (to be called from the LoadingProvider)
export const setGlobalLoadingContext = (context: ReturnType<typeof useLoading>) => {
  globalLoadingContext = context;
};

// Fetch API wrapper with timeout and retry support
const fetchWithRetry = async (
  url: string, 
  options: RequestInit = {}, 
  retries = 2, 
  timeout = 10000
): Promise<Response> => {
  // Add timeout to the fetch request
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  
  console.log(`Fetching: ${url}`);
  console.log('Options:', JSON.stringify(options));
  
  const fetchOptions = {
    ...options,
    signal: controller.signal
  };
  
  try {
    const response = await fetch(url, fetchOptions);
    clearTimeout(id);
    console.log(`Fetch response for ${url}:`, response.status, response.statusText);
    return response;
  } catch (err) {
    clearTimeout(id);
    console.error(`Fetch error for ${url}:`, err);
    
    // If we have retries left and it's a network error, try again
    if (retries > 0 && (
      err instanceof TypeError || // Network error
      err instanceof DOMException && err.name === 'AbortError' // Timeout
    )) {
      console.log(`Retrying fetch to ${url}, ${retries} retries left`);
      // Wait a bit before retrying (exponential backoff)
      await new Promise(r => setTimeout(r, 1000 * (3 - retries)));
      return fetchWithRetry(url, options, retries - 1, timeout);
    }
    
    throw err;
  }
};

// Helper function to handle API errors
const handleApiError = (error: unknown, endpoint: string): any => {
  // Check for rate limit errors
  if (error instanceof Error && error.message && 
     (error.message.includes('rate limit') || error.message.includes('API limit'))) {
    console.error(`GitHub API rate limit exceeded for ${endpoint}:`, error);
    return {
      valid: false,
      error: "GitHub API rate limit exceeded. Please try again later.",
      rate_limit_info: error.message,
      api_limit_exceeded: true
    };
  }
  
  // Check for timeout errors
  if (error instanceof DOMException && error.name === 'AbortError') {
    console.error(`Timeout when connecting to ${endpoint}:`, error);
    return { 
      valid: false,
      error: `Request to API server timed out. Please try again later.`
    };
  }
  
  // Check for network errors
  if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
    console.error(`Network error when connecting to ${endpoint}:`, error);
    return { 
      valid: false,
      error: `Cannot connect to API server. Please check your network connection.`
    };
  }

  // Check for HTTP errors from response
  if (error instanceof Error) {
    console.error(`API error from ${endpoint}:`, error);
    return { 
      valid: false,
      error: error.message
    };
  }

  // Generic error handling
  console.error(`Unknown error from ${endpoint}:`, error);
  return { 
    valid: false,
    error: 'An unexpected error occurred. Please try again later.'
  };
};

// Utilities for fetching from the backend
export async function fetchRepoData(url: string) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/repo`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url }),
    });
    if (!response.ok) throw new Error("Failed to fetch repo info");
    return await response.json();
  } catch (error) {
    return handleApiError(error, 'repo');
  }
}

export async function validateRepo(url: string) {
  return withLoading(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/validate_repo`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      
      let data;
      try {
        data = await response.json();
      } catch (parseError) {
        console.error('Error parsing JSON response:', parseError);
        return { 
          valid: false, 
          error: "Invalid response format from server"
        };
      }
      
      // Check for rate limit error in response data
      if (data && data.error && typeof data.error === 'string' && 
          (data.error.includes('rate limit') || data.error.includes('API limit'))) {
        console.error('GitHub API rate limit error:', data);
        return {
          valid: false,
          error: data.error,
          rate_limit_info: data.rate_limit_info,
          api_limit_exceeded: true
        };
      }
      
      if (!response.ok) {
        console.error('Failed to validate repository:', response.status, response.statusText);
        return { 
          valid: false, 
          error: data?.error || "Repository validation failed" 
        };
      }
      
      return data;
    } catch (error) {
      return handleApiError(error, 'validate_repo');
    }
  });
}

// Languages
export async function fetchLanguages(url: string) {
  return withLoading(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/languages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      if (!response.ok) throw new Error("Failed to fetch languages");
      return await response.json();
    } catch (error) {
      return handleApiError(error, 'languages');
    }
  });
}

// Commits
export async function fetchCommits(url: string, frequency: string = "day") {
  console.log('Fetching commits for:', url);
  
  return withLoading(async () => {
    try {
      const response = await fetchWithRetry(
        `${API_BASE_URL}/api/commits`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url, frequency }),
        },
        2, // retries
        15000 // 15 second timeout
      );
      
      // Special handling for 202 (processing)
      if (response.status === 202) {
        console.log('Commit statistics are processing (202 status)');
        return { isProcessing: true, message: "Generating commit statistics. Please wait..." };
      }
      
      if (!response.ok) {
        console.error('Failed to fetch commit frequency:', response.status, response.statusText);
        throw new Error("Failed to fetch commit frequency");
      }
      
      let data;
      try {
        data = await response.json();
        console.log('Commit data received:', data);
      } catch (parseError) {
        console.error('Error parsing JSON response:', parseError);
        return { 
          isProcessing: false, 
          error: true, 
          message: "Invalid response format from server", 
          commits: [] 
        };
      }
      
      // Validate the data is not null or undefined
      if (!data) {
        console.error('Empty data received from API');
        return { commits: [] };
      }
      
      // Transform the data from {date: count} format to [{date: date, commits: count}] format
      if (data && data.commit_frequency && typeof data.commit_frequency === 'object') {
        try {
          const commits = Object.entries(data.commit_frequency).map(([date, count]) => ({
            date,
            commits: typeof count === 'number' ? count : parseInt(count as string, 10) || 0
          }));
          console.log('Transformed commit data:', commits);
          return { commits };
        } catch (error) {
          console.error('Error transforming commit data:', error);
          return { commits: [] };
        }
      }
      
      // If we've received an array directly, return it as is
      if (Array.isArray(data)) {
        return { commits: data };
      }
      
      // Handle unexpected data formats
      console.warn('Unexpected data format from API:', data);
      return { commits: [] };
    } catch (error) {
      return handleApiError(error, 'commits');
    }
  });
}

// Contributors
export async function fetchContributors(url: string) {
  console.log('Fetching contributors for:', url);
  
  return withLoading(async () => {
    try {
      const response = await fetchWithRetry(
        `${API_BASE_URL}/api/contributors`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url }),
        },
        2, // retries
        15000 // 15 second timeout
      );
      
      // Special handling for 202 (processing)
      if (response.status === 202) {
        console.log('Contributor statistics are processing (202 status)');
        return { isProcessing: true, message: "Generating contributor statistics. Please wait..." };
      }
      
      if (!response.ok) {
        console.error('Failed to fetch contributors:', response.status, response.statusText);
        throw new Error("Failed to fetch contributors");
      }
      
      const data = await response.json();
      console.log('Contributors data received:', data);
      
      // The API returns an array of contributors, but the frontend expects {contributors: Array}
      return { contributors: data };
    } catch (error) {
      return handleApiError(error, 'contributors');
    }
  });
}

// Code Frequency
export async function fetchCodeFrequency(url: string) {
  console.log('Fetching code frequency for:', url);
  
  return withLoading(async () => {
    try {
      const response = await fetchWithRetry(
        `${API_BASE_URL}/api/code_frequency`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url }),
        },
        2, // retries
        15000 // 15 second timeout
      );
      
      // Special handling for 202 (processing)
      if (response.status === 202) {
        console.log('Code frequency statistics are processing (202 status)');
        return { isProcessing: true, message: "Generating code frequency statistics. Please wait..." };
      }
      
      if (!response.ok) {
        console.error('Failed to fetch code frequency:', response.status, response.statusText);
        throw new Error("Failed to fetch code frequency");
      }
      
      const data = await response.json();
      console.log('Code frequency data received:', data);
      
      // Transform the data structure to what the CodeFrequency component expects
      const transformedData = [];
      
      // If the API returns an array of entries, format them for the frontend
      if (Array.isArray(data)) {
        for (const item of data) {
          transformedData.push({
            date: item.Date,
            additions: item["Code Additions"],
            deletions: Math.abs(item["Code Deletions"]) // Store as positive number, component will negate for display
          });
        }
      } else if (data && data.message) {
        // If we have a message, pass it through
        return { message: data.message };
      }
      
      return { frequency: transformedData };
    } catch (error) {
      return handleApiError(error, 'code_frequency');
    }
  });
}

// Pull Requests
export async function fetchPullRequests(url: string) {
  console.log('Fetching pull requests for:', url);
  
  return withLoading(async () => {
    try {
      const response = await fetchWithRetry(
        `${API_BASE_URL}/api/pull_requests`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url }),
        },
        2, // retries
        15000 // 15 second timeout
      );
      
      // Special handling for 202 (processing)
      if (response.status === 202) {
        console.log('Pull request statistics are processing (202 status)');
        return { isProcessing: true, message: "Generating pull request statistics. Please wait..." };
      }
      
      if (!response.ok) {
        console.error('Failed to fetch pull requests:', response.status, response.statusText);
        throw new Error("Failed to fetch pull requests");
      }
      
      const data = await response.json();
      console.log('Pull requests data received:', data);
      
      // Transform the data to match what the PullRequests component expects
      const total = (data.open || 0) + (data.closed_unmerged || 0) + (data.merged || 0);
      
      return {
        stats: {
          open: data.open || 0,
          closed: data.closed_unmerged || 0,
          merged: data.merged || 0,
          total: total
        }
      };
    } catch (error) {
      return handleApiError(error, 'pull_requests');
    }
  }, { useGlobalLoader: false }); // Don't use global loader for pull requests
}

// Heatmap
export async function fetchContributionHeatmap(url: string) {
  console.log('Fetching contribution heatmap for:', url);
  
  return withLoading(async () => {
    try {
      const response = await fetchWithRetry(
        `${API_BASE_URL}/api/contribution_heatmap`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url }),
        },
        2, // retries
        15000 // 15 second timeout
      );
      
      // Special handling for 202 (processing)
      if (response.status === 202) {
        console.log('Contribution heatmap is processing (202 status)');
        return { isProcessing: true, message: "Generating contribution heatmap. Please wait..." };
      }
      
      if (!response.ok) {
        console.error('Failed to fetch contribution heatmap:', response.status, response.statusText);
        throw new Error("Failed to fetch contribution heatmap");
      }
      
      const data = await response.json();
      console.log('Contribution heatmap API response received:', data);
      
      // New API format returns array directly
      if (Array.isArray(data)) {
        console.log('Received array format for contribution heatmap');
        return data;
      }
      
      // Legacy format or processing message
      return data;
    } catch (error) {
      return handleApiError(error, 'contribution_heatmap');
    }
  }, { useGlobalLoader: false }); // Don't use global loader for heatmap
}

// Update or add a loading wrapper function
export const withLoading = async <T,>(
  fn: () => Promise<T>,
  options?: { 
    showLoading?: boolean; 
    size?: "sm" | "md" | "lg"; 
    ballColor?: string;
    useGlobalLoader?: boolean;
  }
): Promise<T> => {
  try {
    // Show loading if specified or useGlobalLoader is not explicitly false (backward compatibility)
    if (options?.useGlobalLoader !== false && options?.showLoading !== false && globalLoadingContext) {
      globalLoadingContext.showLoading({
        size: options?.size || "md",
        ballColor: options?.ballColor,
      });
    }
    
    // Execute the function
    return await fn();
  } finally {
    // Hide loading
    if (options?.useGlobalLoader !== false && options?.showLoading !== false && globalLoadingContext) {
      globalLoadingContext.hideLoading();
    }
  }
};
