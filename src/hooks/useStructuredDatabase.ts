
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { enhancedFileProcessingService } from '@/services/documents/enhancedFileProcessingService';
import { regulatoryDatabaseService } from '@/services/database/regulatoryDatabaseService';
import { DocumentCategory } from '@/types/references';

export const useStructuredDatabase = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  
  /**
   * Process regulatory files and import to structured database
   */
  const processRegulatoryFiles = async (files: File[], specificCategory?: DocumentCategory): Promise<boolean> => {
    if (files.length === 0) return false;
    
    setIsProcessing(true);
    
    try {
      toast({
        title: "Processing regulatory files",
        description: `Processing ${files.length} file(s) for regulatory content...`,
      });
      
      const result = await enhancedFileProcessingService.processRegulatoryFiles(files, specificCategory);
      
      if (result.success) {
        toast({
          title: "Processing complete",
          description: `Successfully processed ${result.filesProcessed} file(s), added ${result.provisionsAdded} provisions and ${result.definitionsAdded} definitions.`,
          variant: "default"
        });
        
        if (result.errors.length > 0) {
          console.warn("Processing warnings:", result.errors);
          toast({
            title: "Processing completed with warnings",
            description: `${result.errors.length} warning(s) occurred during processing.`,
            variant: "destructive",
            duration: 6000,
          });
        }
        
        return true;
      } else {
        toast({
          title: "Processing failed",
          description: result.errors[0] || "Failed to process files",
          variant: "destructive"
        });
        
        console.error("Processing errors:", result.errors);
        return false;
      }
    } catch (error) {
      console.error("Error in regulatory file processing:", error);
      
      toast({
        title: "Processing error",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive"
      });
      
      return false;
    } finally {
      setIsProcessing(false);
    }
  };
  
  /**
   * Search regulatory provisions
   */
  const searchRegulations = async (query: string) => {
    setIsLoading(true);
    
    try {
      const results = await regulatoryDatabaseService.searchProvisions(query);
      return results;
    } catch (error) {
      console.error("Error searching regulatory database:", error);
      toast({
        title: "Search error",
        description: "Failed to search regulatory database",
        variant: "destructive"
      });
      return [];
    } finally {
      setIsLoading(false);
    }
  };
  
  /**
   * Get existing chapters that have been imported
   */
  const getImportedChapters = async (): Promise<string[]> => {
    try {
      const provisions = await regulatoryDatabaseService.getAllProvisions();
      const chapters = [...new Set(provisions.map(p => p.chapter).filter(Boolean))];
      return chapters as string[];
    } catch (error) {
      console.error("Error getting imported chapters:", error);
      return [];
    }
  };
  
  return {
    processRegulatoryFiles,
    searchRegulations,
    getImportedChapters,
    isProcessing,
    isLoading
  };
};
