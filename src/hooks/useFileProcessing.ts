import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { fileProcessingService } from '@/services/documents/fileProcessingService';
import { formatExtractedContent } from '@/utils/fileContentFormatter';
import { checkApiAvailability } from '@/services/api/grok/modules/endpointManager';
import { getGrokApiKey } from '@/services/apiKeyService';
import { forceResetAllCircuitBreakers } from '@/services/api/grok/modules/endpointManager';

export const useFileProcessing = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [isOfflineMode, setIsOfflineMode] = useState(false);
  const [lastApiCheck, setLastApiCheck] = useState(0);
  const [libraryStatus, setLibraryStatus] = useState<{
    mammothAvailable: boolean;
    xlsxAvailable: boolean;
  }>({ mammothAvailable: false, xlsxAvailable: false });
  const { toast } = useToast();

  // Check document processing libraries availability
  useEffect(() => {
    const checkLibraries = () => {
      const status = fileProcessingService.checkLibrariesAvailable();
      setLibraryStatus(status);
      
      if (!status.mammothAvailable) {
        console.warn("Mammoth.js library not detected - Word document processing will be limited");
      }
      
      if (!status.xlsxAvailable) {
        console.warn("SheetJS library not detected - Excel processing will be limited");
      }
    };
    
    // Check immediately and then on window focus (in case libraries load later)
    checkLibraries();
    
    const handleFocus = () => {
      checkLibraries();
    };
    
    window.addEventListener('focus', handleFocus);
    
    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

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
   * Process files and extract text content with improved handling for Word and Excel
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
            description: "The Grok API is currently unreachable. Document processing will use local extraction methods.",
            variant: "destructive",
            duration: 6000,
          });
          
          // Check if libraries are available for offline processing
          const { mammothAvailable, xlsxAvailable } = libraryStatus;
          
          if (!mammothAvailable && files.some(file => 
            file.name.toLowerCase().endsWith('.docx') || 
            file.name.toLowerCase().endsWith('.doc'))) {
            toast({
              title: "Word Processing Limited",
              description: "Mammoth.js library is not available for offline Word document processing.",
              variant: "destructive",
              duration: 4000,
            });
          }
          
          if (!xlsxAvailable && files.some(file => 
            file.name.toLowerCase().endsWith('.xlsx') || 
            file.name.toLowerCase().endsWith('.xls'))) {
            toast({
              title: "Excel Processing Limited",
              description: "SheetJS library is not available for offline Excel processing.",
              variant: "destructive",
              duration: 4000,
            });
          }
        }
      }
      
      toast({
        title: "Processing files",
        description: `Extracting content from ${files.length} file(s)${isOfflineMode ? ' in offline mode' : ''}...`,
      });
      
      // Process files in parallel with improved handling
      const results = await Promise.all(
        files.map(file => {
          // Check file type to provide specific messaging
          const isDocxFile = file.name.toLowerCase().endsWith('.docx') || file.name.toLowerCase().endsWith('.doc');
          const isExcelFile = file.name.toLowerCase().endsWith('.xlsx') || file.name.toLowerCase().endsWith('.xls');
          const isPdfFile = file.name.toLowerCase().endsWith('.pdf');
          
          if (isPdfFile && isOfflineMode) {
            toast({
              title: "PDF processing limited",
              description: "PDF processing requires online mode for best results.",
              variant: "default",
              duration: 3000,
            });
          }
          
          if (isDocxFile && isOfflineMode) {
            if (!libraryStatus.mammothAvailable) {
              toast({
                title: "Word processing limited",
                description: "Mammoth.js is not available for offline Word processing.",
                variant: "default",
                duration: 3000,
              });
            } else {
              toast({
                title: "Processing Word document locally",
                description: "Using browser-based extraction in offline mode.",
                variant: "default",
                duration: 3000,
              });
            }
          }
          
          if (isExcelFile && isOfflineMode) {
            if (!libraryStatus.xlsxAvailable) {
              toast({
                title: "Excel processing limited",
                description: "SheetJS is not available for offline Excel processing.",
                variant: "default",
                duration: 3000,
              });
            } else {
              toast({
                title: "Processing Excel document locally",
                description: "Using browser-based extraction in offline mode.",
                variant: "default",
                duration: 3000,
              });
            }
          }
          
          // Process the file
          return fileProcessingService.processFile(file);
        })
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
          description: "Files were processed with browser-based extraction due to API connectivity issues.",
          variant: "destructive",
          duration: 5000,
        });
      } else if (isOfflineMode) {
        toast({
          title: "Offline processing complete",
          description: `Processed ${files.length} file(s) with browser-based extraction.`,
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
      description: "Resetting circuit breakers and checking API connection...",
    });
    
    try {
      // Force reset all circuit breakers first
      forceResetAllCircuitBreakers();
      
      // Wait briefly to allow reset to take effect
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const apiKey = getGrokApiKey();
      if (!apiKey) {
        toast({
          title: "API key required",
          description: "Please set a valid API key in the settings.",
          variant: "destructive"
        });
        return false;
      }
      
      // Now check availability with fresh circuit breakers
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
    tryReconnect,
    libraryStatus
  };
};
