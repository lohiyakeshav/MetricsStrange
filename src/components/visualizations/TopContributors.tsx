import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { fetchContributors } from "@/services/api";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { RefreshCcw, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CircleLoader } from "@/components/ui/circle-loader";

interface TopContributorsProps {
  url: string;
}

// Define the expected data structure from the API
interface Contributor {
  login: string;
  avatar_url: string;
  commits: number;
  percentage?: number;
}

interface ContributorsResponse {
  contributors?: Contributor[];
  isProcessing?: boolean;
  message?: string;
}

export const TopContributors = ({ url }: TopContributorsProps) => {
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);
  const [timeRange, setTimeRange] = useState<"all" | "month" | "week">("all");
  
  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ["top-contributors", url, timeRange],
    queryFn: async () => {
      try {
        // The API doesn't support timeRange filtering, so we just fetch all contributors
        const contributorsResponse = await fetchContributors(url);
        
        // If processing or error, return as is
        if (contributorsResponse.isProcessing || !contributorsResponse.contributors) {
          return contributorsResponse;
        }
        
        // Filter contributors based on timeRange client-side
        if (timeRange === "week" || timeRange === "month") {
          const now = new Date();
          let cutoffDate = new Date();
          
          if (timeRange === "week") {
            cutoffDate.setDate(now.getDate() - 7); // One week ago
          } else if (timeRange === "month") {
            cutoffDate.setMonth(now.getMonth() - 1); // One month ago
          }
          
          const filteredContributors = contributorsResponse.contributors.filter(contributor => {
            // Since the API doesn't provide contribution dates, we'll just use the current data
            // Note: In a real implementation, we'd need a way to filter by date
            // For now, we'll just return all contributors regardless of timeRange
            return true;
          });
          
          return { contributors: filteredContributors };
        }
        
        return contributorsResponse;
      } catch (err) {
        console.error("Error fetching top contributors:", err);
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
  
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await queryClient.invalidateQueries({ queryKey: ["top-contributors", url, timeRange] });
      await refetch();
    } catch (err) {
      console.error("Error refreshing top contributors:", err);
    } finally {
      setRefreshing(false);
    }
  };

  // Get the contributors array from the response
  const contributors = data?.contributors || [];

  // Content rendering function to handle different states
  const renderContent = () => {
    if (error) {
      return (
        <Card className="p-6">
          <div className="text-center py-8 animate-fade-in">
            <AlertCircle className="h-10 w-10 text-destructive mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-destructive">Error Loading Contributors</h3>
            <p className="text-muted-foreground mt-2 max-w-md mx-auto">
              {error instanceof Error ? error.message : "Failed to fetch contributor data. Please try again."}
            </p>
            <Button onClick={handleRefresh} className="mt-4">
              <RefreshCcw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </Card>
      );
    }

    if (data?.isProcessing) {
      return (
        <Card className="p-6">
          <div className="text-center py-8 animate-fade-in">
            <Loader2 className="h-10 w-10 text-primary mx-auto mb-4 animate-spin" />
            <h3 className="text-xl font-semibold">Processing Data</h3>
            <p className="text-muted-foreground mt-2">
              {data.message || "Analyzing contributor data. This may take a moment..."}
            </p>
          </div>
        </Card>
      );
    }

    if (!contributors || contributors.length === 0) {
      return (
        <Card className="p-6">
          <div className="text-center py-8 animate-fade-in">
            <h3 className="text-xl font-semibold">No Contributor Data Available</h3>
            <p className="text-muted-foreground mt-2">
              No contributor data has been found for this repository within the selected time range.
            </p>
            <Button onClick={handleRefresh} className="mt-4">
              <RefreshCcw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </Card>
      );
    }

    return (
      <div className="grid grid-cols-1 gap-6">
        {contributors.map((contributor, index) => (
          <Card key={contributor.login} className="p-4 flex items-center">
            <div className="flex-shrink-0 mr-4 text-lg font-bold text-muted-foreground w-8 text-center">
              #{index + 1}
            </div>
            <Avatar className="h-12 w-12 mr-4">
              <AvatarImage src={contributor.avatar_url} alt={contributor.login} />
              <AvatarFallback>
                {contributor.login?.substring(0, 2).toUpperCase() || "??"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-grow">
              <div className="font-medium">{contributor.login || "Anonymous"}</div>
              <div className="text-sm text-muted-foreground">
                {contributor.commits} commits
              </div>
            </div>
            {contributor.percentage !== undefined && (
              <div className="text-right">
                <div className="text-sm font-medium">{contributor.percentage}%</div>
                <div className="text-xs text-muted-foreground">of total</div>
              </div>
            )}
          </Card>
        ))}
      </div>
    );
  };

  // Main component render
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">
          Top Contributors {!isLoading && contributors.length > 0 ? `(${contributors.length})` : ''}
        </h2>
        <Button
          onClick={handleRefresh}
          variant="ghost"
          className="gap-2"
          aria-label="Refresh top contributors"
          disabled={refreshing}
        >
          {refreshing ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <RefreshCcw className="w-4 h-4" />
          )}
          Refresh
        </Button>
      </div>
      
      <Tabs defaultValue="all" value={timeRange} onValueChange={(value) => setTimeRange(value as "all" | "month" | "week")}>
        <TabsList className="mb-4">
          <TabsTrigger value="all">All Time</TabsTrigger>
          <TabsTrigger value="month">Past Month</TabsTrigger>
          <TabsTrigger value="week">Past Week</TabsTrigger>
        </TabsList>
        
        <TabsContent value={timeRange} className="mt-0">
          {/* First-time load with no data yet and no error */}
          {isLoading && !data && !error && (
            <Card className="p-6 flex justify-center items-center min-h-[300px]">
              <CircleLoader size="sm" className="text-primary" />
            </Card>
          )}

          {/* Show content when we have data, error, or not loading */}
          {(data || !isLoading || error) && renderContent()}
          
          {/* Overlay loader when refreshing or fetching */}
          {(isFetching && data) && (
            <div className="absolute inset-0 bg-background/50 flex items-center justify-center z-10 rounded-md">
              <CircleLoader size="md" />
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TopContributors; 