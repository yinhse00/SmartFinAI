
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { fileProcessingService } from '@/services/documents/fileProcessingService';
import { formatExtractedContent } from '@/utils/fileContentFormatter';
import { checkApiAvailability } from '@/services/api/grok/modules/endpointManager';
import { getGrokApiKey } from '@/services/apiKeyService';

export const useFileProcessing = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [isOfflineMode, setIsOfflineMode] = useState(false);
  const { toast } = useToast();

  /**
   * Process files and extract text content
   */
  const processFiles = async (files: File[]): Promise<{ content: string; source: string }[]> => {
    if (files.length === 0) return [];
    
    setIsProcessing(true);
    
    try {
      // Check API availability first
      const apiKey = getGrokApiKey();
      if (apiKey) {
        const isApiAvailable = await checkApiAvailability(apiKey).catch(() => false);
        setIsOfflineMode(!isApiAvailable);
        
        if (!isApiAvailable) {
          toast({
            title: "Limited Processing Mode",
            description: "The Grok API is currently unreachable. Files will be processed with limited functionality.",
            variant: "warning",
            duration: 6000,
          });
        }
      }
      
      toast({
        title: "Processing files",
        description: `Extracting content from ${files.length} file(s)...`,
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
        result.content.includes("API Connection Error")
      );
      
      if (apiIssues) {
        toast({
          title: "Limited file processing",
          description: "Some files were processed with limited functionality due to API connectivity issues.",
          variant: "warning",
          duration: 5000,
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

  return { processFiles, isProcessing, isOfflineMode };
};
