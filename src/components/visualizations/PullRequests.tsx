import React, { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { fetchPullRequests } from "@/services/api";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell as RechartCell
} from "recharts";
import { RefreshCcw, Loader2, AlertCircle, GitPullRequestIcon, GitMergeIcon, XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CircleLoader } from "@/components/ui/circle-loader";
import {
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface PullRequestsProps {
  url: string;
}

// Define the types for PR data
interface PullRequestStats {
  open: number;
  closed: number;
  merged: number;
  total: number;
  avgReviewComments?: number;
  avgLifetime?: string;
}

interface TimeDataItem {
  date: string;
  count: number;
}

interface PullRequestData {
  stats?: PullRequestStats;
  timeData?: TimeDataItem[];
  isProcessing?: boolean;
  message?: string;
}

export const PullRequests = ({ url }: PullRequestsProps) => {
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);
  const [isPendingReload, setIsPendingReload] = useState(false);

  const { data, isLoading, error, refetch, isFetching } = useQuery<PullRequestData>({
    queryKey: ["pullRequests", url],
    queryFn: async () => {
      try {
        return await fetchPullRequests(url);
      } catch (err) {
        console.error("Error fetching pull requests:", err);
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

  const isProcessing = data?.isProcessing ?? false;
  
  useEffect(() => {
    if (isProcessing) {
      const intervalId = setInterval(() => {
        refetch();
      }, 5000);
      return () => clearInterval(intervalId);
    }
  }, [isProcessing, refetch]);

  useEffect(() => {
    // Debug log to verify data is received
    if (data && data.stats) {
      console.log('Pull requests data loaded:', data.stats);
    }
    if (data && data.timeData && data.timeData.length > 0) {
      console.log('Pull requests time data loaded:', data.timeData.length, 'entries');
    }
  }, [data]);

  const handleRefresh = async () => {
    setRefreshing(true);
    setIsPendingReload(true);
    try {
      await queryClient.invalidateQueries({ queryKey: ["pullRequests", url] });
      await refetch();
    } catch (err) {
      console.error("Error refreshing pull requests:", err);
    } finally {
      setRefreshing(false);
      setTimeout(() => setIsPendingReload(false), 500); // Keep loading state briefly for better feedback
    }
  };

  // Prepare chart data if available
  const statusData = data?.stats ? [
    { name: "Open", value: data.stats.open || 0, color: "#3b82f6" },
    { name: "Closed", value: data.stats.closed || 0, color: "#22c55e" },
    { name: "Merged", value: data.stats.merged || 0, color: "#a855f7" }
  ] : [];

  // Main component render
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Pull Request Analysis</h2>
        <Button
          onClick={handleRefresh}
          variant="ghost"
          className="gap-2"
          aria-label="Refresh pull requests"
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

      {/* Show error if any */}
      {error && (
        <Card className="p-6">
          <div className="text-center py-8 animate-fade-in">
            <AlertCircle className="h-10 w-10 text-destructive mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-destructive">Error Loading Pull Request Data</h3>
            <p className="text-muted-foreground mt-2 max-w-md mx-auto">
              {error instanceof Error ? error.message : "Failed to fetch pull request information. Please try again."}
            </p>
            <Button onClick={handleRefresh} className="mt-4">
              <RefreshCcw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </Card>
      )}

      {/* First-time loading or No data */}
      {!error && (!data || !data.stats) && (
        <Card className="p-6 relative min-h-[300px]">
          {(isLoading || isFetching || isProcessing || isPendingReload) && (
            <div className="absolute inset-0 flex items-center justify-center bg-card/50 backdrop-blur-sm z-10">
              <CircleLoader size="lg" />
            </div>
          )}
        </Card>
      )}

      {/* Show PR data when available */}
      {!error && data && data.stats && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="p-4 flex flex-col items-center">
              <h3 className="text-lg font-semibold text-center">Total PRs</h3>
              <p className="text-3xl font-bold">{data.stats.total}</p>
            </Card>
            <Card className="p-4 flex flex-col items-center">
              <h3 className="text-lg font-semibold text-center">Average Review Comments</h3>
              <p className="text-3xl font-bold">{data.stats.avgReviewComments?.toFixed(1) || 0}</p>
            </Card>
            <Card className="p-4 flex flex-col items-center">
              <h3 className="text-lg font-semibold text-center">Average PR Lifetime</h3>
              <p className="text-3xl font-bold">{data.stats.avgLifetime || 'N/A'}</p>
            </Card>
          </div>

          <Card className="p-6 relative min-h-[300px]">
            <h3 className="text-lg font-semibold mb-4">Pull Request Status</h3>
            <div className="h-80 relative">
              {(isLoading || isFetching || isProcessing || isPendingReload) && (
                <div className="absolute inset-0 flex items-center justify-center bg-card/50 backdrop-blur-sm z-10">
                  <CircleLoader size="lg" />
                </div>
              )}
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({name, percent}) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {statusData.map((entry, index) => (
                      <RechartCell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [value, 'Count']} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {data.timeData && data.timeData.length > 0 && (
            <Card className="p-6 relative min-h-[300px]">
              <h3 className="text-lg font-semibold mb-4">Pull Requests Over Time ({data.timeData.length} entries)</h3>
              <div className="h-80 relative">
                {(isLoading || isFetching || isProcessing || isPendingReload) && (
                  <div className="absolute inset-0 flex items-center justify-center bg-card/50 backdrop-blur-sm z-10">
                    <CircleLoader size="lg" />
                  </div>
                )}
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={data.timeData}
                    margin={{
                      top: 20,
                      right: 30,
                      left: 20,
                      bottom: 70,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="date" 
                      angle={-45} 
                      textAnchor="end"
                      height={70}
                      tick={{fontSize: 12}} 
                    />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="count" name="Pull Requests" fill="#10b981" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          )}
        </>
      )}

      {/* Processing state overlay */}
      {isProcessing && (
        <Card className="p-6 relative min-h-[100px]">
          <div className="flex flex-col items-center justify-center">
            <CircleLoader size="lg" className="mb-2" />
            <p className="text-muted-foreground text-sm">
              {data?.message || "Processing pull request data. Please wait..."}
            </p>
          </div>
        </Card>
      )}
    </div>
  );
};

export default PullRequests;
