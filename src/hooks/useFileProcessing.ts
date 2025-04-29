
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { fileProcessingService } from '@/services/documents/fileProcessingService';
import { formatExtractedContent } from '@/utils/fileContentFormatter';

export const useFileProcessing = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  /**
   * Process files and extract text content
   */
  const processFiles = async (files: File[]): Promise<{ content: string; source: string }[]> => {
    if (files.length === 0) return [];
    
    setIsProcessing(true);
    
    try {
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
      
      toast({
        title: "File processing complete",
        description: `Successfully processed ${files.length} file(s).`,
      });
      
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

  return { processFiles, isProcessing };
};
