import React, { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { fetchContributors } from "@/services/api";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { RefreshCcw, Loader2, Users, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { CircleLoader } from "@/components/ui/circle-loader";

interface ContributorsProps {
  url: string;
}

export const Contributors = ({ url }: ContributorsProps) => {
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);
  const [view, setView] = useState<"chart" | "list">("chart");

  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ["contributors", url],
    queryFn: async () => {
      try {
        return await fetchContributors(url);
      } catch (err) {
        console.error("Error fetching contributors:", err);
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
    if (data) {
      console.log('Contributors raw data:', data);
      if (Array.isArray(data)) {
        console.log('Contributors data is an array with', data.length, 'items');
      } else if (data.contributors && Array.isArray(data.contributors)) {
        console.log('Contributors data has', data.contributors.length, 'contributors');
      }
    }
  }, [data]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await queryClient.invalidateQueries({ queryKey: ["contributors", url] });
      await refetch();
    } catch (err) {
      console.error("Error refreshing contributors:", err);
    } finally {
      setRefreshing(false);
    }
  };

  // Content section for reuse
  const renderContent = () => {
    if (error) {
      return (
        <Card className="p-6">
          <div className="text-center py-8 animate-fade-in">
            <AlertCircle className="h-10 w-10 text-destructive mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-destructive">Error Loading Contributor Data</h3>
            <p className="text-muted-foreground mt-2 max-w-md mx-auto">
              {error instanceof Error ? error.message : "Failed to fetch contributor information. Please try again."}
            </p>
            <Button onClick={handleRefresh} className="mt-4">
              <RefreshCcw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </Card>
      );
    }

    // Handle direct array response from API
    if (Array.isArray(data)) {
      // Check if the array has any items
      if (data.length === 0) {
        return (
          <Card className="p-6">
            <div className="text-center py-8 animate-fade-in">
              <h3 className="text-xl font-semibold">No Contributor Data Available</h3>
              <p className="text-muted-foreground mt-2">
                This repository doesn't have any contributor data or it couldn't be analyzed.
              </p>
              <Button onClick={handleRefresh} className="mt-4">
                <RefreshCcw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
            </div>
          </Card>
        );
      }
      
      // Use the array directly for chart and list
      const contributors = data;
      // Get top contributors for chart view
      const topContributors = [...contributors]
        .sort((a, b) => b.commits - a.commits)
        .slice(0, 10)
        .map(c => ({
          name: c.login || c.name || 'Anonymous',
          commits: c.commits,
          additions: c.additions || 0,
          deletions: c.deletions || 0,
        }));

      return (
        <>
          {view === "chart" ? (
            <Card className="p-6 relative">
              <h3 className="text-lg font-semibold mb-4">Top 10 Contributors by Commits</h3>
              <div className="h-80">
                {(isLoading || isFetching) && !error && (
                  <div className="absolute inset-0 flex items-center justify-center bg-card/50 backdrop-blur-sm z-10">
                    <CircleLoader size="lg" />
                  </div>
                )}
                {isProcessing ? (
                  <div className="text-center absolute inset-0 flex flex-col items-center justify-center bg-card/50 backdrop-blur-sm z-10">
                    <CircleLoader size="lg" className="mb-4" />
                    <p className="text-muted-foreground">
                      Processing contributor data. Please wait...
                    </p>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={topContributors}
                      margin={{
                        top: 20,
                        right: 30,
                        left: 20,
                        bottom: 70,
                      }}
                      barSize={20}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        dataKey="name"
                        angle={-45}
                        textAnchor="end"
                        height={70}
                        tick={{ fontSize: 12 }}
                      />
                      <YAxis />
                      <Tooltip formatter={(value) => [value.toLocaleString(), 'Commits']} />
                      <Legend />
                      <Bar dataKey="commits" name="Commits" fill="#10b981" />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </Card>
          ) : (
            <Card className="p-6 relative">
              <div className="overflow-auto max-h-[500px]">
                {(isLoading || isFetching) && !error && (
                  <div className="absolute inset-0 flex items-center justify-center bg-card/50 backdrop-blur-sm z-10">
                    <CircleLoader size="lg" />
                  </div>
                )}
                {isProcessing ? (
                  <div className="text-center absolute inset-0 flex flex-col items-center justify-center bg-card/50 backdrop-blur-sm z-10">
                    <CircleLoader size="lg" className="mb-4" />
                    <p className="text-muted-foreground">
                      Processing contributor data. Please wait...
                    </p>
                  </div>
                ) : (
                  <table className="w-full">
                    <thead className="sticky top-0 bg-card z-5">
                      <tr className="border-b border-border">
                        <th className="text-left py-3 px-4">Contributor</th>
                        <th className="text-right py-3 px-4">Commits</th>
                        <th className="text-right py-3 px-4">Additions</th>
                        <th className="text-right py-3 px-4">Deletions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {contributors.map((contributor, index) => (
                        <tr key={index} className="border-b border-border">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              <Avatar className="h-8 w-8">
                                {contributor.avatar_url ? (
                                  <img src={contributor.avatar_url} alt={contributor.login || 'Contributor'} />
                                ) : (
                                  <Users className="h-4 w-4" />
                                )}
                              </Avatar>
                              <div>
                                <p className="font-medium">{contributor.login || contributor.name || 'Anonymous'}</p>
                                {contributor.email && <p className="text-xs text-muted-foreground">{contributor.email}</p>}
                              </div>
                            </div>
                          </td>
                          <td className="text-right py-3 px-4">{contributor.commits.toLocaleString()}</td>
                          <td className="text-right py-3 px-4 text-green-500">
                            +{(contributor.additions || 0).toLocaleString()}
                          </td>
                          <td className="text-right py-3 px-4 text-red-500">
                            -{(contributor.deletions || 0).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </Card>
          )}
        </>
      );
    }
    
    // If data is not an array or data.contributors isn't available or empty
    if (!data || !data.contributors || data.contributors.length === 0) {
      return (
        <Card className="p-6">
          <div className="text-center py-8 animate-fade-in">
            <h3 className="text-xl font-semibold">No Contributor Data Available</h3>
            <p className="text-muted-foreground mt-2">
              This repository doesn't have any contributor data or it couldn't be analyzed.
            </p>
            <Button onClick={handleRefresh} className="mt-4">
              <RefreshCcw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </Card>
      );
    }

    // If we have contributors data in the expected format
    const { contributors } = data;
    // Get top contributors for chart view
    const topContributors = [...contributors]
      .sort((a, b) => b.commits - a.commits)
      .slice(0, 10)
      .map(c => ({
        name: c.login || c.name || 'Anonymous',
        commits: c.commits,
        additions: c.additions || 0,
        deletions: c.deletions || 0,
      }));

    return (
      <>
        {view === "chart" ? (
          <Card className="p-6 relative">
            <h3 className="text-lg font-semibold mb-4">Top 10 Contributors by Commits</h3>
            <div className="h-80">
              {(isLoading || isFetching) && !error && (
                <div className="absolute inset-0 flex items-center justify-center bg-card/50 backdrop-blur-sm z-10">
                  <CircleLoader size="lg" />
                </div>
              )}
              {isProcessing ? (
                <div className="text-center absolute inset-0 flex flex-col items-center justify-center bg-card/50 backdrop-blur-sm z-10">
                  <CircleLoader size="lg" className="mb-4" />
                  <p className="text-muted-foreground">
                    Processing contributor data. Please wait...
                  </p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={topContributors}
                    margin={{
                      top: 20,
                      right: 30,
                      left: 20,
                      bottom: 70,
                    }}
                    barSize={20}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="name"
                      angle={-45}
                      textAnchor="end"
                      height={70}
                      tick={{ fontSize: 12 }}
                    />
                    <YAxis />
                    <Tooltip formatter={(value) => [value.toLocaleString(), 'Commits']} />
                    <Legend />
                    <Bar dataKey="commits" name="Commits" fill="#10b981" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </Card>
        ) : (
          <Card className="p-6 relative">
            <div className="overflow-auto max-h-[500px]">
              {(isLoading || isFetching) && !error && (
                <div className="absolute inset-0 flex items-center justify-center bg-card/50 backdrop-blur-sm z-10">
                  <CircleLoader size="lg" />
                </div>
              )}
              {isProcessing ? (
                <div className="text-center absolute inset-0 flex flex-col items-center justify-center bg-card/50 backdrop-blur-sm z-10">
                  <CircleLoader size="lg" className="mb-4" />
                  <p className="text-muted-foreground">
                    Processing contributor data. Please wait...
                  </p>
                </div>
              ) : (
                <table className="w-full">
                  <thead className="sticky top-0 bg-card z-5">
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-4">Contributor</th>
                      <th className="text-right py-3 px-4">Commits</th>
                      <th className="text-right py-3 px-4">Additions</th>
                      <th className="text-right py-3 px-4">Deletions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {contributors.map((contributor, index) => (
                      <tr key={index} className="border-b border-border">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              {contributor.avatar_url ? (
                                <img src={contributor.avatar_url} alt={contributor.login || 'Contributor'} />
                              ) : (
                                <Users className="h-4 w-4" />
                              )}
                            </Avatar>
                            <div>
                              <p className="font-medium">{contributor.login || contributor.name || 'Anonymous'}</p>
                              {contributor.email && <p className="text-xs text-muted-foreground">{contributor.email}</p>}
                            </div>
                          </div>
                        </td>
                        <td className="text-right py-3 px-4">{contributor.commits.toLocaleString()}</td>
                        <td className="text-right py-3 px-4 text-green-500">
                          +{(contributor.additions || 0).toLocaleString()}
                        </td>
                        <td className="text-right py-3 px-4 text-red-500">
                          -{(contributor.deletions || 0).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </Card>
        )}
      </>
    );
  };

  // Main component render
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Contributors {data && !isLoading ? `(${Array.isArray(data) ? data.length : (data.contributors ? data.contributors.length : 0)})` : ''}</h2>
        <div className="flex gap-2">
          <div className="flex rounded-md overflow-hidden border border-border">
            <Button
              onClick={() => setView("chart")}
              variant={view === "chart" ? "default" : "outline"}
              className="rounded-none px-3"
              size="sm"
              disabled={refreshing || (isLoading && !data && !error)} // Don't disable when there's an error
            >
              Chart
            </Button>
            <Button
              onClick={() => setView("list")}
              variant={view === "list" ? "default" : "outline"}
              className="rounded-none px-3"
              size="sm"
              disabled={refreshing || (isLoading && !data && !error)} // Don't disable when there's an error
            >
              List
            </Button>
          </div>
          <Button
            onClick={handleRefresh}
            variant="ghost"
            className="gap-2"
            aria-label="Refresh contributors"
            disabled={refreshing} // Always allow refresh when there's an error
          >
            {refreshing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCcw className="w-4 h-4" />
            )}
            Refresh
          </Button>
        </div>
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

export default Contributors;
