import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { fetchLanguages } from "@/services/api";
import { EmptyState } from "./EmptyState";

interface LanguageData {
  name: string;
  percentage: number;
  bytes: number;
  color: string;
}

interface LanguageResponse {
  bytes?: { [key: string]: number };
  percentages?: { [key: string]: number };
  isProcessing?: boolean;
  message?: string;
}

export const Languages = ({ url }: { url: string }) => {
  const [languages, setLanguages] = useState<LanguageData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingMessage, setProcessingMessage] = useState("");

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    setIsProcessing(false);
    
    try {
      const data = await fetchLanguages(url);
      
      if (data.isProcessing) {
        setIsProcessing(true);
        setProcessingMessage(data.message || "GitHub is generating language statistics. Please try again in a moment.");
        return;
      }
      
      // Check if we have language data
      if (!data || (!data.bytes && !data.percentages) || Object.keys(data).length === 0) {
        setLanguages([]);
        return;
      }
      
      // Transform the data for display
      const response = data as LanguageResponse;
      
      // Language colors (simplified version - in a real app you might want to use GitHub's language colors)
      const colors = [
        "#2b7489", "#f1e05a", "#563d7c", "#e34c26", "#4F5D95", "#178600", 
        "#b07219", "#41b883", "#3572A5", "#89e051", "#000080", "#3D6117"
      ];
      
      // Create language data using either bytes or percentages depending on what's available
      const result: LanguageData[] = [];
      
      if (response.bytes && response.percentages) {
        // If we have both, use them together
        Object.entries(response.bytes).forEach(([name, bytes], index) => {
          const percentage = response.percentages?.[name] || 0;
          result.push({
            name,
            percentage,
            bytes,
            color: colors[index % colors.length]
          });
        });
      } else if (response.bytes) {
        // If we only have bytes, calculate percentages
        const totalBytes = Object.values(response.bytes).reduce((sum, value) => sum + value, 0);
        
        Object.entries(response.bytes).forEach(([name, bytes], index) => {
          const percentage = totalBytes > 0 ? Math.round((bytes / totalBytes) * 1000) / 10 : 0;
          result.push({
            name,
            percentage,
            bytes,
            color: colors[index % colors.length]
          });
        });
      } else if (response.percentages) {
        // If we only have percentages
        Object.entries(response.percentages).forEach(([name, percentage], index) => {
          result.push({
            name,
            percentage,
            bytes: 0, // We don't have the actual bytes
            color: colors[index % colors.length]
          });
        });
      }
      
      // Sort by percentage
      const sortedResult = result.sort((a, b) => b.percentage - a.percentage);
      setLanguages(sortedResult);
    } catch (err) {
      console.error("Error fetching language data:", err);
      setError("Failed to load language data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [url]);

  if (loading) {
    return (
      <EmptyState
        title="Loading Languages"
        message="Fetching language data from GitHub API..."
        icon="loading"
      />
    );
  }

  if (error) {
    return (
      <EmptyState
        title="Error Loading Languages"
        message={error}
        icon="error"
        onRetry={fetchData}
      />
    );
  }

  if (isProcessing) {
    return (
      <EmptyState
        title="Processing Data"
        message={processingMessage}
        icon="processing"
        onRetry={fetchData}
      />
    );
  }

  if (languages.length === 0) {
    return (
      <EmptyState
        title="No Language Data Available"
        message="This repository doesn't have any language data or is empty."
        icon="empty"
        onRetry={fetchData}
      />
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Languages</CardTitle>
        <CardDescription>
          Distribution of programming languages used in this repository
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Language bars */}
        <div className="space-y-4">
          <div className="w-full bg-muted h-4 rounded-full overflow-hidden flex">
            {languages.map((lang, i) => (
              <div
                key={i}
                style={{
                  width: `${lang.percentage}%`,
                  backgroundColor: lang.color
                }}
                className="h-full"
                title={`${lang.name}: ${lang.percentage}%`}
              />
            ))}
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {languages.map((lang, i) => (
              <div key={i} className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: lang.color }}
                />
                <span className="text-sm font-medium truncate">
                  {lang.name}
                </span>
                <span className="text-sm text-muted-foreground ml-auto">
                  {lang.percentage.toFixed(1)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
