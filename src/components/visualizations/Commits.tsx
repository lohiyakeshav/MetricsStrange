import React, { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { 
  LineChart, 
  Line, 
  BarChart,
  Bar,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  ComposedChart,
  Area,
  Label
} from "recharts";
import { Card } from "@/components/ui/card";
import { fetchCommits } from "@/services/api";
import { RefreshCcw, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CircleLoader } from "@/components/ui/circle-loader";

interface CommitsProps {
  url: string;
}

// Define the API response interface
interface CommitResponse {
  commit_frequency?: { [date: string]: number };
  commits?: Array<{ date: string, count: number }>;
  isProcessing?: boolean;
  message?: string;
  error?: boolean;
}

/**
 * Parse an unusual date format like "2025-16" (year-week) into a proper date string
 * @param dateStr The date string to parse
 * @returns A properly formatted date string
 */
function parseCommitDate(dateStr: string): string {
  try {
    // Check if it's a full date (YYYY-MM-DD)
    if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-US', { month: 'short', day: '2-digit' });
    }
    
    // Check if it's in year-week format (e.g., "2025-16")
    const yearWeekMatch = dateStr.match(/^(\d{4})-(\d{1,2})$/);
    
    if (yearWeekMatch) {
      const [_, year, week] = yearWeekMatch;
      
      // Create a date for Jan 1 of the given year
      const date = new Date(parseInt(year, 10), 0, 1);
      
      // If it's week-based, calculate the date of the 1st day of that week
      const weekNum = parseInt(week, 10);
      
      // Add (week - 1) * 7 days to Jan 1
      // This assumes week 1 starts on Jan 1, which might need adjustment
      date.setDate(date.getDate() + (weekNum - 1) * 7);
      
      // Format the date as "MMM YYYY" to show month and year
      return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    }
    
    // If it's already a proper date format, just return it
    return dateStr;
  } catch (error) {
    console.error('Error parsing date:', dateStr, error);
    return dateStr; // Return original if parsing fails
  }
}

/**
 * Transform commit frequency object to array format for charting
 */
function transformCommitData(data: CommitResponse): Array<{ date: string, count: number, displayDate: string }> {
  try {
    if (!data) return [];
    
    // Log raw data for debugging
    console.log('Raw data in transformCommitData:', data);
    
    // If we already have the commits array format, return it
    if (data.commits && Array.isArray(data.commits)) {
      return data.commits.map(item => ({
        ...item,
        displayDate: formatDisplayDate(item.date)
      }));
    }
    
    // If we have commit_frequency object, transform it
    if (data.commit_frequency && typeof data.commit_frequency === 'object') {
      // Sort dates in ascending order to show chronological progression
      const sortedDates = Object.keys(data.commit_frequency).sort();
      
      const result = sortedDates.map(date => {
        // Ensure count is a number
        const rawCount = data.commit_frequency![date];
        const count = typeof rawCount === 'number' ? rawCount : parseInt(String(rawCount), 10) || 0;
        
        return { 
          date,
          count,
          displayDate: formatDisplayDate(date)
        };
      });
      
      // Log transformed data for debugging
      console.log('Transformed commit data:', result);
      
      return result;
    }
    
    return [];
  } catch (error) {
    console.error('Error in transformCommitData:', error);
    return []; // Return empty array as fallback
  }
}

/**
 * Format a date string for display purposes
 */
function formatDisplayDate(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  } catch (e) {
    return dateStr;
  }
}

/**
 * Custom tooltip component for the chart
 */
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length && payload[0] && payload[0].value !== undefined) {
    try {
      const dateObj = new Date(label || '');
      const formattedDate = dateObj.toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
      
      return (
        <div className="bg-card p-3 border rounded-md shadow-md">
          <p className="font-semibold text-sm">{formattedDate}</p>
          <p className="text-emerald-500 font-bold">
            {payload[0].value} {payload[0].value === 1 ? 'commit' : 'commits'}
          </p>
        </div>
      );
    } catch (e) {
      console.error('Error in tooltip:', e);
      return null;
    }
  }

  return null;
};

export const Commits = ({ url }: CommitsProps) => {
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);
  const [chartType, setChartType] = useState<'line' | 'bar' | 'composed'>('composed');
  
  const { data, isLoading, error, refetch, isFetching } = useQuery<CommitResponse>({
    queryKey: ["commits", url],
    queryFn: async () => {
      try {
        return await fetchCommits(url);
      } catch (err) {
        console.error("Error fetching commits:", err);
        throw err;
      }
    },
    enabled: !!url,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    retry: 2,
    refetchInterval: false,
    refetchOnWindowFocus: false,
  });
  
  // Debug log when data changes
  useEffect(() => {
    if (data) {
      console.log('Commit response data:', data);
    }
  }, [data]);
  
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await queryClient.invalidateQueries({ queryKey: ["commits", url] });
      await refetch();
    } catch (err) {
      console.error("Error refreshing commits:", err);
    } finally {
      setRefreshing(false);
    }
  };

  // Check if we're in a processing state
  const isProcessing = data?.isProcessing === true;

  // Get commits data in the right format
  const commits = transformCommitData(data || {});
  const hasCommits = commits && Array.isArray(commits) && commits.length > 0;

  // Calculate maximum commit count for scaling
  const maxCommits = hasCommits && commits 
    ? Math.max(...commits.map(item => (item && typeof item.count === 'number') ? item.count : 0))
    : 0;

  // Content rendering function to handle different states
  const renderContent = () => {
    // Check for both explicit errors and error flag in response
    if (error || data?.error) {
      const errorMessage = error instanceof Error 
        ? error.message 
        : (data?.message || "Failed to fetch commit data. Please try again.");
        
      return (
        <Card className="p-6">
          <div className="text-center py-8 animate-fade-in">
            <AlertCircle className="h-10 w-10 text-destructive mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-destructive">Error Loading Commits</h3>
            <p className="text-muted-foreground mt-2 max-w-md mx-auto">
              {errorMessage}
            </p>
            <Button onClick={handleRefresh} className="mt-4">
              <RefreshCcw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </Card>
      );
    }

    if (isProcessing) {
      return (
        <Card className="p-6">
          <div className="text-center py-8 animate-fade-in">
            <div className="text-center absolute inset-0 flex flex-col items-center justify-center bg-card/50 backdrop-blur-sm z-10">
              <CircleLoader size="lg" className="mb-4" />
              <p className="text-muted-foreground">
                {data?.message || "Processing commit data. Please wait..."}
              </p>
            </div>
          </div>
        </Card>
      );
    }

    if (!hasCommits) {
      return (
        <Card className="p-6">
          <div className="text-center py-8 animate-fade-in">
            <h3 className="text-xl font-semibold">No Commit Data Available</h3>
            <p className="text-muted-foreground mt-2">
              This repository doesn't have any commit data or it couldn't be analyzed.
            </p>
            <Button onClick={handleRefresh} className="mt-4">
              <RefreshCcw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </Card>
      );
    }

    // Calculate total commits - with better error handling
    let totalCommits = 0;
    try {
      if (commits && Array.isArray(commits)) {
        totalCommits = commits.reduce((sum, item) => {
          // Ensure count is a number and handle undefined/null
          const count = item && typeof item.count === 'number' ? item.count : 0;
          return sum + count;
        }, 0);
      }
      
      console.log('Total commits calculated:', totalCommits);
    } catch (e) {
      console.error('Error calculating total commits:', e);
      totalCommits = 0; // Ensure a fallback value
    }

    return (
      <>
        <Card className="p-6 flex flex-col items-center mb-6">
          <h3 className="text-lg font-semibold text-center">Total Commits</h3>
          <p className="text-4xl font-bold text-emerald-500 mt-2">
            {typeof totalCommits === 'number' ? totalCommits.toLocaleString() : '0'}
          </p>
          <p className="text-muted-foreground text-sm mt-1">
            Across {commits?.length || 0} {(commits?.length === 1) ? 'day' : 'days'}
          </p>
        </Card>
        
        <Card className="p-6 relative">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Commits Over Time</h3>
            <div className="flex gap-2">
              <Button 
                size="sm" 
                variant={chartType === 'line' ? 'default' : 'outline'} 
                onClick={() => setChartType('line')}
                className={chartType === 'line' ? 'bg-emerald-600 hover:bg-emerald-700' : ''}
              >
                Line
              </Button>
              <Button 
                size="sm" 
                variant={chartType === 'bar' ? 'default' : 'outline'} 
                onClick={() => setChartType('bar')}
                className={chartType === 'bar' ? 'bg-emerald-600 hover:bg-emerald-700' : ''}
              >
                Bar
              </Button>
              <Button 
                size="sm" 
                variant={chartType === 'composed' ? 'default' : 'outline'} 
                onClick={() => setChartType('composed')}
                className={chartType === 'composed' ? 'bg-emerald-600 hover:bg-emerald-700' : ''}
              >
                Combined
              </Button>
            </div>
          </div>
          
          {isLoading || isFetching ? (
            <div className="absolute inset-0 flex items-center justify-center bg-card/50 backdrop-blur-sm z-10">
              <CircleLoader size="lg" />
            </div>
          ) : (
            <div className="h-80">
              {!hasCommits ? (
                <div className="h-full flex items-center justify-center text-muted-foreground">
                  No commit data available to display
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  {/* Ensure we have valid data before rendering charts */}
                  {commits && Array.isArray(commits) && commits.length > 0 ? (
                    chartType === 'line' ? (
                      <LineChart 
                        data={commits}
                        margin={{ top: 20, right: 30, left: 20, bottom: 30 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#2a2b31" />
                        <XAxis 
                          dataKey="date" 
                          angle={-45} 
                          textAnchor="end"
                          height={60}
                          tick={{fontSize: 12}} 
                        />
                        <YAxis domain={[0, maxCommits > 0 ? 'auto' : 1]}>
                          <Label
                            value="Commits"
                            position="insideLeft"
                            angle={-90}
                            style={{ textAnchor: 'middle', fill: 'var(--muted-foreground)' }}
                          />
                        </YAxis>
                        <Tooltip content={<CustomTooltip />} />
                        <Legend />
                        <Line 
                          type="monotone" 
                          dataKey="count" 
                          name="Commits" 
                          stroke="#10b981" 
                          activeDot={{ r: 8 }} 
                          strokeWidth={3}
                          dot={{ r: 6, strokeWidth: 2, fill: 'var(--card)' }}
                        />
                      </LineChart>
                    ) : chartType === 'bar' ? (
                      <BarChart
                        data={commits}
                        margin={{ top: 20, right: 30, left: 20, bottom: 30 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#2a2b31" />
                        <XAxis 
                          dataKey="date" 
                          angle={-45} 
                          textAnchor="end"
                          height={60}
                          tick={{fontSize: 12}} 
                        />
                        <YAxis domain={[0, maxCommits > 0 ? 'auto' : 1]}>
                          <Label
                            value="Commits"
                            position="insideLeft"
                            angle={-90}
                            style={{ textAnchor: 'middle', fill: 'var(--muted-foreground)' }}
                          />
                        </YAxis>
                        <Tooltip content={<CustomTooltip />} />
                        <Legend />
                        <Bar 
                          dataKey="count" 
                          name="Commits" 
                          fill="#10b981"
                          radius={[4, 4, 0, 0]}
                        />
                      </BarChart>
                    ) : (
                      <ComposedChart
                        data={commits}
                        margin={{ top: 20, right: 30, left: 20, bottom: 30 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#2a2b31" />
                        <XAxis 
                          dataKey="date" 
                          angle={-45} 
                          textAnchor="end"
                          height={60}
                          tick={{fontSize: 12}} 
                        />
                        <YAxis domain={[0, maxCommits > 0 ? 'auto' : 1]}>
                          <Label
                            value="Commits"
                            position="insideLeft"
                            angle={-90}
                            style={{ textAnchor: 'middle', fill: 'var(--muted-foreground)' }}
                          />
                        </YAxis>
                        <Tooltip content={<CustomTooltip />} />
                        <Legend />
                        <Bar 
                          dataKey="count" 
                          name="Commits" 
                          fill="#059669"
                          fillOpacity={0.8}
                          radius={[4, 4, 0, 0]}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="count" 
                          name="Trend" 
                          stroke="#34d399" 
                          strokeWidth={3}
                          dot={{ r: 6, strokeWidth: 2, fill: 'var(--card)' }}
                        />
                        <Area
                          type="monotone"
                          dataKey="count"
                          fill="#10b981"
                          stroke="none"
                          fillOpacity={0.2}
                        />
                      </ComposedChart>
                    )
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-muted-foreground">
                      Unable to render chart - invalid data format
                    </div>
                  )}
                </ResponsiveContainer>
              )}
            </div>
          )}

          {hasCommits && (
            <div className="mt-4">
              <h4 className="text-sm font-semibold mb-3">Recent Activity</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {commits && Array.isArray(commits) && commits.slice(-3).reverse().map((commit, index) => (
                  <div key={index} className="flex items-center p-2 rounded-md border border-border bg-card/50">
                    <div className="w-12 h-12 rounded-full flex items-center justify-center bg-emerald-500/10 text-emerald-500 mr-3">
                      <span className="text-lg font-bold">{commit?.count || 0}</span>
                    </div>
                    <div>
                      <p className="font-medium">{commit?.displayDate || 'Unknown date'}</p>
                      <p className="text-sm text-muted-foreground">
                        {commit?.count || 0} {(commit?.count === 1) ? 'commit' : 'commits'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>
      </>
    );
  };

  // Main component render
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">
          Commits {hasCommits ? `(${commits?.length || 0} entries)` : ''}
        </h2>
        <Button
          onClick={handleRefresh}
          variant="ghost"
          className="gap-2"
          aria-label="Refresh commits"
          disabled={refreshing || isProcessing}
        >
          {refreshing ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <RefreshCcw className="w-4 h-4" />
          )}
          Refresh
        </Button>
      </div>
      
      {/* First-time load with no data yet and no error */}
      {isLoading && !data && !error && (
        <Card className="p-6 flex justify-center items-center h-80">
          <CircleLoader size="sm" className="text-primary" />
        </Card>
      )}

      {/* Show content when we have data, error, or not loading */}
      {(data || !isLoading || error) && renderContent()}
    </div>
  );
};

export default Commits;
