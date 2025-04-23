import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { fetchRepoData } from "@/services/api";
import { Star, GitFork, Eye, RefreshCcw, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { CustomLoader } from "@/components/ui/CustomLoader";

interface OverviewProps {
  url: string;
}

/**
 * Overview component that displays basic repository information
 * 
 * @param url GitHub repository URL
 */
export const Overview = ({ url }: OverviewProps) => {
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["repoData", url],
    queryFn: () => fetchRepoData(url),
    enabled: !!url,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });

  /**
   * Handle manual refresh of repository data
   */
  const handleRefresh = async () => {
    setRefreshing(true);
    await queryClient.invalidateQueries({ queryKey: ["repoData", url] });
    await refetch();
    setRefreshing(false);
  };

  if (isLoading) {
    return <CustomLoader />;
  }

  if (error) {
    return (
      <div className="text-center py-8 animate-fade-in">
        <h3 className="text-xl font-semibold text-destructive">Error Loading Data</h3>
        <p className="text-muted-foreground mt-2">
          There was a problem fetching the repository information.
        </p>
        <Button onClick={handleRefresh} className="mt-4">
          <RefreshCcw className={`w-4 h-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-8 animate-fade-in">
        <p className="text-muted-foreground">No data available</p>
        <Button onClick={handleRefresh} className="mt-4">
          <RefreshCcw className={`w-4 h-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">{data.name}</h2>
        <Button
          onClick={handleRefresh}
          variant="ghost"
          className="gap-2"
          aria-label="Refresh overview"
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
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6 flex flex-col items-center text-center">
          <div className="bg-primary/10 p-4 rounded-full mb-4">
            <Star className="h-8 w-8 text-primary" />
          </div>
          <h3 className="text-3xl font-bold">{data.stars.toLocaleString()}</h3>
          <p className="text-muted-foreground">Stars</p>
        </Card>
        
        <Card className="p-6 flex flex-col items-center text-center">
          <div className="bg-primary/10 p-4 rounded-full mb-4">
            <GitFork className="h-8 w-8 text-primary" />
          </div>
          <h3 className="text-3xl font-bold">{data.forks.toLocaleString()}</h3>
          <p className="text-muted-foreground">Forks</p>
        </Card>
        
        <Card className="p-6 flex flex-col items-center text-center">
          <div className="bg-primary/10 p-4 rounded-full mb-4">
            <Eye className="h-8 w-8 text-primary" />
          </div>
          <h3 className="text-3xl font-bold">{data.watchers.toLocaleString()}</h3>
          <p className="text-muted-foreground">Watchers</p>
        </Card>
      </div>
      
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Repository Details</h3>
        <div className="text-sm space-y-2">
          <p>Repository URL: <a href={url} className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">{url}</a></p>
        </div>
      </Card>
    </div>
  );
};
