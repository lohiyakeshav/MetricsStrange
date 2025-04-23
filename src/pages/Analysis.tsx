import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { 
  ArrowLeft, 
  Star, 
  GitFork, 
  Eye,
  BarChart3,
  Users,
  Code,
  GitPullRequest,
  Calendar,
  RefreshCcw,
  Loader2,
  LineChart,
  CalendarDays // Using CalendarDays instead of HeatMap which doesn't exist
} from "lucide-react";

import { fetchRepoData } from "@/services/api";
import { Overview } from "@/components/visualizations/Overview";
import { Languages } from "@/components/visualizations/Languages";
import { Commits } from "@/components/visualizations/Commits";
import { Contributors } from "@/components/visualizations/Contributors";
import { PullRequests } from "@/components/visualizations/PullRequests";
import { CodeFrequency } from "@/components/visualizations/CodeFrequency";
import { ContributionHeatmap } from "@/components/visualizations/ContributionHeatmap";

// Define the tabs for API sections
const tabs = [
  { id: "overview", label: "Overview", icon: BarChart3 },
  { id: "commits", label: "Commits", icon: Calendar },
  { id: "contributors", label: "Contributors", icon: Users },
  { id: "languages", label: "Languages", icon: Code },
  { id: "pull-requests", label: "Pull Requests", icon: GitPullRequest },
  { id: "code-frequency", label: "Code Frequency", icon: LineChart },
  { id: "heatmap", label: "Contribution Heatmap", icon: CalendarDays }, // Updated icon
];

const Analysis = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const url = location.state?.url;
  const [activeTab, setActiveTab] = useState("overview");

  // Redirect if no URL is provided
  useEffect(() => {
    if (!url) {
      toast.error("No repository URL provided");
      navigate("/");
    }
  }, [url, navigate]);

  // Fetch repository data
  const { data: repoData, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["repo", url],
    queryFn: async () => fetchRepoData(url),
    enabled: !!url,
  });

  // Add check for rate limit errors
  const isRateLimited = error && 
    typeof error === 'object' && 
    (error as any)?.api_limit_exceeded === true;

  const rateLimitInfo = isRateLimited ? (error as any)?.rate_limit_info : null;

  if (!url) {
    return null; // Will redirect in useEffect
  }

  // Render the appropriate visualization based on the active tab
  const renderVisualization = () => {
    // Don't try to render visualizations if we're rate limited
    if (isRateLimited) {
      return (
        <div className="text-center py-12 bg-card rounded-lg border border-border p-6">
          <h3 className="text-xl font-bold text-destructive mb-4">GitHub API Rate Limit Exceeded</h3>
          
          {rateLimitInfo && typeof rateLimitInfo === 'object' && rateLimitInfo.minutes_to_reset && (
            <p className="text-lg mb-4">
              Please try again in approximately {rateLimitInfo.minutes_to_reset} minutes.
            </p>
          )}
          
          <p className="text-muted-foreground mb-6">
            GitHub limits the number of API requests. This helps ensure the service remains available for everyone.
          </p>
          
          <div className="max-w-md mx-auto px-6 py-4 bg-background rounded-md border border-border mb-6">
            <h4 className="font-medium mb-2">While you wait:</h4>
            <ul className="text-left list-disc pl-5 space-y-2">
              <li>The GitHub API typically resets its limit every hour</li>
              <li>Try with a different repository that hasn't been analyzed recently</li>
              <li>Or come back later to continue your analysis</li>
            </ul>
          </div>
          
          <Button 
            onClick={() => navigate("/")}
            className="mt-2"
            size="lg"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Go Back Home
          </Button>
        </div>
      );
    }

    // Regular tab rendering
    switch (activeTab) {
      case "overview":
        return <Overview url={url} />;
      case "languages":
        return <Languages url={url} />;
      case "commits":
        return <Commits url={url} />;
      case "contributors":
        return <Contributors url={url} />;
      case "pull-requests":
        return <PullRequests url={url} />;
      case "code-frequency":
        return <CodeFrequency url={url} />;
      case "heatmap":
        return <ContributionHeatmap url={url} />;
      default:
        return <Overview url={url} />;
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Header with repo info and theme toggle */}
      <header className="border-b border-border">
        <div className="container max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate("/")}
            className="flex items-center gap-1"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back</span>
          </Button>
          
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => refetch()}
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCcw className="h-4 w-4" />
              )}
              <span className="ml-1">Refresh</span>
            </Button>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main content area with repo stats and visualization */}
      <main className="flex-1 container max-w-7xl mx-auto px-4 py-8">
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-10 w-64" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Skeleton className="h-24" />
              <Skeleton className="h-24" />
              <Skeleton className="h-24" />
            </div>
          </div>
        ) : isError && !isRateLimited ? (
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold text-destructive mb-2">Error Loading Repository Data</h2>
            <p className="text-muted-foreground mb-4">
              {error instanceof Error 
                ? error.message 
                : "There was an issue fetching data for this repository."}
            </p>
            <Button onClick={() => refetch()}>Try Again</Button>
          </div>
        ) : (
          <>
            {/* Repository heading */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold mb-4">
                {repoData?.name || "Repository Analysis"}
              </h1>
              
              {/* Stats cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <div className="bg-card rounded-lg p-4 border border-border flex items-center gap-4">
                  <div className="bg-primary/10 p-3 rounded-full">
                    <Star className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Stars</p>
                    <p className="text-2xl font-bold">{repoData?.stars.toLocaleString() || 0}</p>
                  </div>
                </div>
                
                <div className="bg-card rounded-lg p-4 border border-border flex items-center gap-4">
                  <div className="bg-primary/10 p-3 rounded-full">
                    <GitFork className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Forks</p>
                    <p className="text-2xl font-bold">{repoData?.forks.toLocaleString() || 0}</p>
                  </div>
                </div>
                
                <div className="bg-card rounded-lg p-4 border border-border flex items-center gap-4">
                  <div className="bg-primary/10 p-3 rounded-full">
                    <Eye className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Watchers</p>
                    <p className="text-2xl font-bold">{repoData?.watchers.toLocaleString() || 0}</p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Tab navigation */}
            <div className="border-b border-border mb-6">
              <div className="flex overflow-x-auto hide-scrollbar gap-1">
                {tabs.map((tab) => (
                  <Button
                    key={tab.id}
                    variant={activeTab === tab.id ? "default" : "ghost"}
                    className={`rounded-none border-b-2 ${
                      activeTab === tab.id 
                        ? "border-primary" 
                        : "border-transparent"
                    } px-4 py-2`}
                    onClick={() => setActiveTab(tab.id)}
                  >
                    <tab.icon className="mr-2 h-4 w-4" />
                    {tab.label}
                  </Button>
                ))}
              </div>
            </div>
            
            {/* Content area for visualizations */}
            <div className="bg-card rounded-lg border border-border p-6">
              {renderVisualization()}
            </div>
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-4 px-8 text-center text-sm text-muted-foreground">
        <p>Powered by GitHub API • Beautifully designed for developers</p>
      </footer>
    </div>
  );
};

export default Analysis;
