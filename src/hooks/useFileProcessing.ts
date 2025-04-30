
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
  const [retryCount, setRetryCount] = useState(0);
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
        // Add a small random delay to prevent multiple simultaneous checks
        const randomDelay = Math.floor(Math.random() * 500);
        await new Promise(resolve => setTimeout(resolve, randomDelay));
        
        const isAvailable = await checkApiAvailability(apiKey);
        
        if (isAvailable && isOfflineMode) {
          // Only show toast when transitioning from offline to online
          toast({
            title: "API connection restored",
            description: "SmartFinAI is now operating in online mode with full functionality.",
          });
          setRetryCount(0); // Reset retry count on success
        } else if (!isAvailable && !isOfflineMode) {
          toast({
            title: "Connection lost",
            description: "SmartFinAI is now operating in offline mode with limited functionality.",
            variant: "destructive"
          });
        }
        
        setIsOfflineMode(!isAvailable);
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
            variant: "destructive",
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

  // Try to reconnect to the API with improved retry logic
  const tryReconnect = async (): Promise<boolean> => {
    setIsProcessing(true);
    
    toast({
      title: "Attempting to reconnect",
      description: "Checking API connection...",
    });
    
    try {
      // Implement exponential backoff for retries
      const backoffDelay = Math.min(1000 * Math.pow(1.5, retryCount), 8000); // Max 8 seconds
      await new Promise(resolve => setTimeout(resolve, backoffDelay));
      
      const apiKey = getGrokApiKey();
      if (!apiKey) {
        toast({
          title: "API key required",
          description: "Please set a valid API key in the settings.",
          variant: "destructive"
        });
        return false;
      }
      
      // Try multiple times with different endpoints
      let isAvailable = false;
      
      // First try proxy endpoint
      isAvailable = await checkApiAvailability(apiKey);
      
      setIsOfflineMode(!isAvailable);
      
      if (isAvailable) {
        toast({
          title: "Connection restored",
          description: "API connection is now available. Full functionality restored.",
        });
        setRetryCount(0); // Reset retry count on success
        return true;
      } else {
        // Increment retry count for backoff on future attempts
        setRetryCount(prev => prev + 1);
        
        toast({
          title: "Connection failed",
          description: "The API is still unreachable. Please check your internet connection and try again.",
          variant: "destructive"
        });
        return false;
      }
    } catch (error) {
      console.error("Error reconnecting:", error);
      setRetryCount(prev => prev + 1);
      
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
