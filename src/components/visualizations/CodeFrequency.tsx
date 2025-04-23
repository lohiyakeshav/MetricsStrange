import React, { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { fetchCodeFrequency } from "@/services/api";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer, 
  Area, 
  AreaChart,
  TooltipProps 
} from "recharts";
import { RefreshCcw, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CircleLoader } from "@/components/ui/circle-loader";

interface CodeFrequencyProps {
  url: string;
}

export const CodeFrequency = ({ url }: CodeFrequencyProps) => {
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);

  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ["codeFrequency", url],
    queryFn: async () => {
      try {
        return await fetchCodeFrequency(url);
      } catch (err) {
        console.error("Error fetching code frequency:", err);
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
    // Debug log to verify data is received correctly
    if (data && data.frequency && data.frequency.length > 0) {
      console.log('Code frequency data loaded:', data.frequency.length, 'entries');
    }
  }, [data]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await queryClient.invalidateQueries({ queryKey: ["codeFrequency", url] });
      await refetch();
    } catch (err) {
      console.error("Error refreshing code frequency:", err);
    } finally {
      setRefreshing(false);
    }
  };

  // Content rendering function to handle different states
  const renderContent = () => {
    if (error) {
      return (
        <Card className="p-6">
          <div className="text-center py-8 animate-fade-in">
            <AlertCircle className="h-10 w-10 text-destructive mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-destructive">Error Loading Code Frequency</h3>
            <p className="text-muted-foreground mt-2 max-w-md mx-auto">
              {error instanceof Error ? error.message : "Failed to fetch code frequency. Please try again."}
            </p>
            <Button onClick={handleRefresh} className="mt-4">
              <RefreshCcw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </Card>
      );
    }

    if (!data || !data.frequency || data.frequency.length === 0) {
      return (
        <Card className="p-6">
          <div className="text-center py-8 animate-fade-in">
            <h3 className="text-xl font-semibold">No Code Frequency Data Available</h3>
            <p className="text-muted-foreground mt-2">
              This repository doesn't have any code frequency data or it couldn't be analyzed.
            </p>
            <Button onClick={handleRefresh} className="mt-4">
              <RefreshCcw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </Card>
      );
    }

    // Process code frequency data
    const chartData = data.frequency.map((item) => ({
      date: item.date,
      additions: item.additions,
      deletions: -Math.abs(item.deletions) // Make deletions negative for the chart
    }));

    // Calculate totals
    const totals = data.frequency.reduce(
      (acc, item) => {
        acc.additions += item.additions;
        acc.deletions += item.deletions;
        return acc;
      },
      { additions: 0, deletions: 0 }
    );

    // Custom tooltip formatter function
    const customTooltipFormatter = (value, name) => {
      return [Math.abs(Number(value)).toLocaleString(), name === 'deletions' ? 'Deletions' : 'Additions'];
    };

    return (
      <>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="p-4 flex flex-col items-center">
            <h3 className="text-lg font-semibold text-center">Total Additions</h3>
            <p className="text-3xl font-bold text-green-500">{totals.additions.toLocaleString()}</p>
          </Card>
          <Card className="p-4 flex flex-col items-center">
            <h3 className="text-lg font-semibold text-center">Total Deletions</h3>
            <p className="text-3xl font-bold text-red-500">{totals.deletions.toLocaleString()}</p>
          </Card>
        </div>
        
        <Card className="p-6 relative">
          <h3 className="text-lg font-semibold mb-4">Additions and Deletions Over Time</h3>
          
          {isLoading || isFetching || isProcessing ? (
            <div className="absolute inset-0 flex items-center justify-center bg-card/50 backdrop-blur-sm z-10">
              <CircleLoader size="lg" />
            </div>
          ) : (
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={chartData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 30 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date" 
                    angle={-45} 
                    textAnchor="end"
                    height={60}
                    tick={{fontSize: 12}} 
                  />
                  <YAxis />
                  <Tooltip formatter={customTooltipFormatter} />
                  <Legend />
                  <Area type="monotone" dataKey="additions" name="Additions" stroke="#10b981" fill="#10b981" fillOpacity={0.6} />
                  <Area type="monotone" dataKey="deletions" name="Deletions" stroke="#ef4444" fill="#ef4444" fillOpacity={0.6} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>

        {isProcessing && (
          <div className="text-center absolute inset-0 flex flex-col items-center justify-center bg-card/50 backdrop-blur-sm z-10">
            <CircleLoader size="lg" className="mb-4" />
            <p className="text-muted-foreground">
              {data?.message || "Processing code frequency data. Please wait..."}
            </p>
          </div>
        )}
      </>
    );
  };

  // Main component render
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">
          Code Frequency {!isLoading && data?.frequency?.length > 0 ? `(${data.frequency.length} entries)` : ''}
        </h2>
        <Button
          onClick={handleRefresh}
          variant="ghost"
          className="gap-2"
          aria-label="Refresh code frequency"
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
      
      {/* First-time load with no data yet and no error */}
      {isLoading && !data && !error && (
        <Card className="p-6 flex justify-center items-center h-80">
          <CircleLoader size="sm" />
        </Card>
      )}

      {/* Show content when we have data, error, or not loading */}
      {(data || !isLoading || error) && renderContent()}
    </div>
  );
};

export default CodeFrequency;
