import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ThemeToggle } from "@/components/theme-toggle";
import { toast } from "sonner";
import { Github, ArrowRight } from "lucide-react";
import { validateRepo } from "@/services/api";

const Index = () => {
  const [url, setUrl] = useState("");
  const navigate = useNavigate();

  /**
   * Validates the repository URL and redirects to analysis page if valid.
   * Shows appropriate error messages for invalid URLs.
   */
  const handleValidateRepo = async () => {
    if (!url.trim()) {
      toast.error("Please enter a GitHub repository URL");
      return;
    }

    // Basic URL validation
    if (!url.startsWith("https://github.com/") && !url.startsWith("http://github.com/")) {
      toast.error("Please enter a valid GitHub repository URL");
      return;
    }

    try {
      const result = await validateRepo(url);

      // Handle GitHub API rate limit errors specially
      if (result.api_limit_exceeded) {
        let message = "GitHub API rate limit exceeded. Please try again later.";
        
        // Add reset time info if available
        if (result.rate_limit_info && typeof result.rate_limit_info === 'object' && result.rate_limit_info.minutes_to_reset) {
          message = `GitHub API rate limit exceeded. Please try again in ${result.rate_limit_info.minutes_to_reset} minutes.`;
        }
        
        toast.error(message, {
          duration: 8000, // Show longer for rate limit info
          description: "The GitHub API has a limit on how many requests can be made. Please wait a moment and try again."
        });
        return;
      }

      if (result.valid) {
        toast.success("Repository found! Redirecting to analysis...");
        navigate("/analysis", { state: { url } });
      } else {
        toast.error(result.error || "Invalid repository URL");
      }
    } catch (error) {
      toast.error("Failed to validate repository. Please try again.");
      console.error("Error validating repository:", error);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <header className="py-6 px-8 flex justify-end">
        <ThemeToggle />
      </header>
      
      <main className="flex-1 flex flex-col items-center justify-center px-4">
        <div className="max-w-2xl w-full space-y-12 animate-fadeIn">
          <div className="text-center space-y-4">
            <div className="flex justify-center mb-6">
              <Github className="h-16 w-16 text-primary" />
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight">
              GitHub Repo Analyzer
            </h1>
            <p className="text-lg text-muted-foreground max-w-lg mx-auto">
              Enter a GitHub repository URL to analyze its stats, commits, language usage, and more.
            </p>
          </div>
          
          <div className="space-y-4">
            <div className="flex flex-col md:flex-row gap-3">
              <Input
                type="text"
                placeholder="https://github.com/owner/repo"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="flex-1 h-12 text-base"
                onKeyPress={(e) => e.key === 'Enter' && handleValidateRepo()}
              />
              <Button 
                onClick={handleValidateRepo}
                className="h-12 px-6"
              >
                <span className="flex items-center gap-2">
                  Analyze <ArrowRight className="h-4 w-4" />
                </span>
              </Button>
            </div>
            <p className="text-sm text-muted-foreground text-center">
              Example: https://github.com/facebook/react
            </p>
          </div>
        </div>
      </main>
      
      <footer className="py-6 px-8 text-center text-sm text-muted-foreground">
        <p>Powered by GitHub API • Beautifully designed for developers</p>
      </footer>
    </div>
  );
};

export default Index;
