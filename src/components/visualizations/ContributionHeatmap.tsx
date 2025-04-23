import React, { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { fetchContributionHeatmap } from "@/services/api";
import { RefreshCcw, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CircleLoader } from "@/components/ui/circle-loader";

interface ContributionHeatmapProps {
  url: string;
}

// Direct response is now an array of dates and commits
interface HeatmapDataItem {
  date: string;
  commits: number;
}

// Possible processing response
interface ProcessingResponse {
  isProcessing: boolean;
  message?: string;
}

// Union type for all possible response types
type HeatmapResponse = HeatmapDataItem[] | ProcessingResponse;

// Helper to check if data is processing response
function isProcessingResponse(data: any): boolean {
  return data && data.isProcessing === true;
}

export const ContributionHeatmap = ({ url }: ContributionHeatmapProps) => {
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);

  const { data, isLoading, error, refetch, isFetching } = useQuery<HeatmapResponse>({
    queryKey: ["contributionHeatmap", url],
    queryFn: async () => {
      try {
        const result = await fetchContributionHeatmap(url);
        console.log('Contribution heatmap data:', result);
        // Check if the result is an array (direct format from API)
        if (Array.isArray(result)) {
          return result as HeatmapDataItem[];
        }
        
        // Handle processing case or any other non-array response
        if (result && result.isProcessing) {
          return result as ProcessingResponse;
        }
        
        // Handle legacy format (convert from object)
        if (result && result.commit_frequency) {
          return Object.entries(result.commit_frequency).map(([date, commits]) => ({
            date,
            commits: commits as number
          }));
        }
        
        return [];
      } catch (err) {
        console.error("Error fetching contribution heatmap:", err);
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

  // After retrieving data, check if it's processing
  const isProcessing = isProcessingResponse(data);
  
  // Update refetch interval if data is processing
  useEffect(() => {
    if (isProcessing) {
      const intervalId = setInterval(() => {
        refetch();
      }, 5000);
      return () => clearInterval(intervalId);
    }
  }, [isProcessing, refetch]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await queryClient.invalidateQueries({ queryKey: ["contributionHeatmap", url] });
      await refetch();
    } catch (err) {
      console.error("Error refreshing contribution heatmap:", err);
    } finally {
      setRefreshing(false);
    }
  };

  // Function to organize data by year, month, and day
  const organizeDataByDate = (data: HeatmapDataItem[] | undefined) => {
    if (!data || !Array.isArray(data) || data.length === 0) return { years: [], commitsByDate: {}, maxCommits: 0 };
    
    // Create a map of date -> commits
    const commitsByDate: { [date: string]: number } = {};
    let maxCommits = 0;
    
    data.forEach(item => {
      if (item.date && typeof item.commits === 'number') {
        commitsByDate[item.date] = item.commits;
        if (item.commits > maxCommits) maxCommits = item.commits;
      }
    });
    
    // Get unique years
    const years = Array.from(new Set(data
      .filter(item => item.date && !isNaN(new Date(item.date).getFullYear()))
      .map(item => new Date(item.date).getFullYear())))
      .sort((a, b) => b - a); // Sort years in descending order (most recent first)
    
    return { years, commitsByDate, maxCommits };
  };

  const { years, commitsByDate, maxCommits } = organizeDataByDate(Array.isArray(data) ? data : []);
  
  // Helper function to get the color intensity based on the value
  const getCommitColor = (commits: number, max: number): string => {
    if (commits === 0) return 'bg-slate-200 dark:bg-slate-700'; // Light grey in light mode, darker grey in dark mode
    
    // GitHub-like green scale (lighter to darker)
    const colorScale = [
      'bg-[#0e4429]', // Darkest
      'bg-[#006d32]',
      'bg-[#26a641]',
      'bg-[#39d353]'  // Lightest
    ];
    
    // Calculate which color to use based on the number of commits relative to max
    const ratio = commits / max;
    
    if (ratio <= 0.25) return colorScale[0];
    if (ratio <= 0.5) return colorScale[1];
    if (ratio <= 0.75) return colorScale[2];
    return colorScale[3];
  };

  // Generate weeks and days for a year's heatmap
  const generateYearHeatmap = (year: number) => {
    const startDate = new Date(year, 0, 1); // Jan 1st of the year
    const endDate = new Date(year, 11, 31); // Dec 31st of the year
    
    // Adjust start date to the nearest Sunday before or on Jan 1st
    const dayOfWeek = startDate.getDay();
    startDate.setDate(startDate.getDate() - dayOfWeek);
    
    // Generate all days from adjusted start to end
    const days = [];
    const currentDate = new Date(startDate);
    
    // Create a column for each week
    const weeks = [];
    
    while (currentDate <= endDate) {
      const currentDateString = currentDate.toISOString().split('T')[0];
      const month = currentDate.getMonth();
      const dayOfWeek = currentDate.getDay();
      
      // If Sunday, start a new week
      if (dayOfWeek === 0) {
        weeks.push({
          week: weeks.length,
          days: []
        });
      }
      
      // Add this day to the current week
      weeks[weeks.length - 1].days.push({
        date: currentDateString,
        month,
        commits: commitsByDate[currentDateString] || 0,
        dayOfWeek
      });
      
      // Move to next day
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return weeks;
  };

  const hasCommitData = Array.isArray(data) && data.length > 0;
  
  // Get month labels (Jan-Dec)
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  // Main component render
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Contribution Heatmap</h2>
        <Button
          onClick={handleRefresh}
          variant="ghost"
          className="gap-2"
          aria-label="Refresh heatmap"
          disabled={refreshing || isLoading || isFetching}
        >
          {refreshing || isLoading || isFetching ? (
            <CircleLoader size="xs" className="mr-2" />
          ) : (
            <RefreshCcw className="w-4 h-4 mr-2" />
          )}
          Refresh
        </Button>
      </div>

      {/* Always show a Card, but with different content based on state */}
      <Card className="p-6 relative min-h-[300px]">
        {/* Error state */}
        {error && (
          <div className="text-center py-8 animate-fade-in">
            <AlertCircle className="h-10 w-10 text-destructive mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-destructive">Error Loading Contribution Heatmap</h3>
            <p className="text-muted-foreground mt-2 max-w-md mx-auto">
              {error instanceof Error ? error.message : "Failed to fetch contribution heatmap. Please try again."}
            </p>
            <Button onClick={handleRefresh} className="mt-4">
              <RefreshCcw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        )}

        {/* Loading state - show inside the card */}
        {(isLoading || isFetching || isProcessing) && !error && (
          <div className="absolute inset-0 flex items-center justify-center bg-card/50 backdrop-blur-sm z-10">
            <CircleLoader size="lg" />
          </div>
        )}

        {/* No data available */}
        {!isLoading && !error && !hasCommitData && !isProcessing && (
          <div className="text-center py-8 animate-fade-in">
            <h3 className="text-xl font-semibold">No Contribution Heatmap Available</h3>
            <p className="text-muted-foreground mt-2">
              This repository doesn't have any contribution heatmap data or it couldn't be analyzed.
            </p>
            <Button onClick={handleRefresh} className="mt-4">
              <RefreshCcw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        )}

        {/* Data available - render heatmap */}
        {hasCommitData && (
          <div className="space-y-10">
            {years.map(year => {
              const weeks = generateYearHeatmap(year);
              const totalCommits = Array.isArray(data) ? data
                .filter(item => new Date(item.date).getFullYear() === year)
                .reduce((sum, item) => sum + item.commits, 0) : 0;
                
              return (
                <div key={`year-${year}`} className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-bold">{totalCommits} contributions in {year}</h3>
                  </div>
                  
                  <div className="relative">
                    {/* Month labels */}
                    <div className="flex mb-2 text-xs text-muted-foreground">
                      <div className="w-10"></div> {/* Space for day labels */}
                      <div className="flex-1 flex">
                        {months.map(month => (
                          <div key={month} className="flex-1 text-center">{month}</div>
                        ))}
                      </div>
                    </div>
                    
                    <div className="flex">
                      {/* Day of week labels */}
                      <div className="flex flex-col w-10 text-xs text-muted-foreground mr-2">
                        <div className="h-3"></div> {/* Empty space for alignment */}
                        <div className="h-3 my-[1px]">Mon</div>
                        <div className="h-3 my-[1px]"></div> {/* Empty for Wed */}
                        <div className="h-3 my-[1px]">Wed</div>
                        <div className="h-3 my-[1px]"></div> {/* Empty for Fri */}
                        <div className="h-3 my-[1px]">Fri</div>
                        <div className="h-3 my-[1px]"></div> {/* Empty for Sun */}
                      </div>
                      
                      {/* Grid of contribution squares */}
                      <div className="flex-1 overflow-x-auto">
                        <div className="flex">
                          {weeks.map(week => (
                            <div key={`week-${week.week}`} className="flex flex-col">
                              {Array.from({ length: 7 }).map((_, dayIndex) => {
                                const day = week.days.find(d => d.dayOfWeek === dayIndex);
                                
                                return (
                                  <div 
                                    key={`day-${dayIndex}`} 
                                    className={`h-3 w-3 m-[1px] rounded-sm ${day ? getCommitColor(day.commits, maxCommits) : 'bg-slate-200 dark:bg-slate-700'}`}
                                    title={day ? `${day.date}: ${day.commits} commits` : 'No data'}
                                  ></div>
                                );
                              })}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                    
                    {/* Legend */}
                    <div className="flex justify-end items-center mt-2 text-xs text-muted-foreground">
                      <span>Less</span>
                      <div className="flex mx-2">
                        <div className="h-3 w-3 m-[1px] rounded-sm bg-slate-200 dark:bg-slate-700"></div>
                        <div className="h-3 w-3 m-[1px] rounded-sm bg-[#0e4429]"></div>
                        <div className="h-3 w-3 m-[1px] rounded-sm bg-[#006d32]"></div>
                        <div className="h-3 w-3 m-[1px] rounded-sm bg-[#26a641]"></div>
                        <div className="h-3 w-3 m-[1px] rounded-sm bg-[#39d353]"></div>
                      </div>
                      <span>More</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        
        {/* Processing state */}
        {isProcessing && (
          <div className="text-center absolute inset-0 flex flex-col items-center justify-center bg-card/50 backdrop-blur-sm z-10">
            <CircleLoader size="lg" className="mb-4" />
            <p className="text-muted-foreground">
              {!Array.isArray(data) && data?.message ? data.message : "Processing contribution data. Please wait..."}
            </p>
          </div>
        )}
      </Card>
    </div>
  );
};
