
import { useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { summaryIndexService } from '@/services/database/summaryIndexService';

/**
 * Hook for managing the Summary and Keyword Index
 */
export const useSummaryIndex = () => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Initialize the summary index
  useEffect(() => {
    const initializeIndex = async () => {
      if (!isInitialized && !isLoading) {
        setIsLoading(true);
        try {
          await summaryIndexService.initializeSummaryIndex();
          setIsInitialized(true);
          console.log('Summary and Keyword Index initialized successfully');
        } catch (error) {
          console.error('Error initializing Summary Index:', error);
          toast({
            title: 'Indexing Error',
            description: 'Failed to initialize the Summary and Keyword Index.',
            variant: 'destructive'
          });
        } finally {
          setIsLoading(false);
        }
      }
    };

    initializeIndex();
  }, [toast]);

  return {
    isIndexInitialized: isInitialized,
    isIndexLoading: isLoading
  };
};
