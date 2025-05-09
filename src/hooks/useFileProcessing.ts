
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { fileProcessingService } from '@/services/documents/fileProcessingService';
import { formatExtractedContent } from '@/utils/fileContentFormatter';
import { checkApiAvailability } from '@/services/api/grok/modules/endpointManager';
import { getGrokApiKey } from '@/services/apiKeyService';

export const useFileProcessing = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [isOfflineMode, setIsOfflineMode] = useState(false);
  const [lastApiCheck, setLastApiCheck] = useState(0);
  const { toast } = useToast();

  // Periodically check API availability in the background
  useEffect(() => {
    const checkApiStatus = async () => {
      const apiKey = getGrokApiKey();
      if (!apiKey) {
        setIsOfflineMode(true);
        return;
      }
      
      try {
        const isAvailable = await checkApiAvailability(apiKey);
        setIsOfflineMode(!isAvailable);
        
        if (isAvailable && isOfflineMode) {
          // Only show toast when transitioning from offline to online
          toast({
            title: "API connection restored",
            description: "SmartFinAI is now operating in online mode with full functionality.",
          });
        }
      } catch (error) {
        console.error("Error checking API status:", error);
        setIsOfflineMode(true);
      }
      
      setLastApiCheck(Date.now());
    };
    
    // Check immediately on mount
    checkApiStatus();
    
    // Then check periodically (every 30 seconds)
    const interval = setInterval(() => {
      // Only check if it's been more than 30 seconds since last check
      if (Date.now() - lastApiCheck > 30000) {
        checkApiStatus();
      }
    }, 30000);
    
    return () => clearInterval(interval);
  }, [isOfflineMode, lastApiCheck, toast]);

  /**
   * Process files and extract text content with improved offline handling
   */
  const processFiles = async (files: File[]): Promise<{ content: string; source: string }[]> => {
    if (files.length === 0) return [];
    
    setIsProcessing(true);
    
    try {
      // First check API availability to set offline mode
      const apiKey = getGrokApiKey();
      if (apiKey) {
        const isApiAvailable = await checkApiAvailability(apiKey).catch(() => false);
        setIsOfflineMode(!isApiAvailable);
        
        if (!isApiAvailable) {
          toast({
            title: "Operating in Offline Mode",
            description: "The Grok API is currently unreachable. Files will be processed with limited functionality.",
            variant: "destructive", // This is already correct
            duration: 6000,
          });
        }
      }
      
      toast({
        title: "Processing files",
        description: `Extracting content from ${files.length} file(s)${isOfflineMode ? ' in offline mode' : ''}...`,
      });
      
      const results = await Promise.all(
        files.map(file => fileProcessingService.processFile(file))
      );
      
      // Format each result with the appropriate header
      const formattedResults = results.map(result => ({
        content: formatExtractedContent(result.source, result.content),
        source: result.source
      }));
      
      // Check if any results indicate API issues
      const apiIssues = results.some(result => 
        result.content.includes("API is unreachable") || 
        result.content.includes("API Connection Error") ||
        result.content.includes("API Unreachable")
      );
      
      if (apiIssues) {
        // Update offline mode flag if API issues were detected
        setIsOfflineMode(true);
        
        toast({
          title: "Limited file processing",
          description: "Files were processed with limited functionality due to API connectivity issues.",
          variant: "destructive",
          duration: 5000,
        });
      } else if (isOfflineMode) {
        toast({
          title: "Offline processing complete",
          description: `Processed ${files.length} file(s) with limited functionality.`,
          variant: "default"
        });
      } else {
        toast({
          title: "File processing complete",
          description: `Successfully processed ${files.length} file(s).`,
        });
      }
      
      return formattedResults;
    } catch (error) {
      toast({
        title: "Error processing files",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive"
      });
      console.error("File processing error:", error);
      return [];
    } finally {
      setIsProcessing(false);
    }
  };

  // Try to reconnect to the API
  const tryReconnect = async (): Promise<boolean> => {
    setIsProcessing(true);
    
    toast({
      title: "Attempting to reconnect",
      description: "Checking API connection...",
    });
    
    try {
      const apiKey = getGrokApiKey();
      if (!apiKey) {
        toast({
          title: "API key required",
          description: "Please set a valid API key in the settings.",
          variant: "destructive"
        });
        return false;
      }
      
      const isAvailable = await checkApiAvailability(apiKey);
      setIsOfflineMode(!isAvailable);
      
      if (isAvailable) {
        toast({
          title: "Connection restored",
          description: "API connection is now available. Full functionality restored.",
        });
        return true;
      } else {
        toast({
          title: "Connection failed",
          description: "The API is still unreachable. Please check your internet connection and try again.",
          variant: "destructive"
        });
        return false;
      }
    } catch (error) {
      console.error("Error reconnecting:", error);
      toast({
        title: "Reconnection error",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive"
      });
      return false;
    } finally {
      setIsProcessing(false);
      setLastApiCheck(Date.now());
    }
  };

  return { 
    processFiles, 
    isProcessing, 
    isOfflineMode,
    tryReconnect
  };
};
