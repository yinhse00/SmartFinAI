
import { useCallback, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';

/**
 * Hook for handling retry functionality with enhanced parameter preservation
 */
export const useRetryHandler = (
  lastQuery: string,
  setInput: React.Dispatch<React.SetStateAction<string>>
) => {
  const { toast } = useToast();
  const processQueryRef = useRef<(query: string) => Promise<void>>();
  
  // Store the last used context and parameters for consistent retries
  const lastContextRef = useRef<{
    regulatoryContext?: string;
    reasoning?: string;
    financialQueryType?: string;
  }>({});

  const setProcessQueryFn = useCallback((processQueryFn: (query: string) => Promise<void>) => {
    processQueryRef.current = processQueryFn;
  }, []);
  
  const setLastContext = useCallback((context: {
    regulatoryContext?: string;
    reasoning?: string;
    financialQueryType?: string;
  }) => {
    lastContextRef.current = context;
  }, []);

  const retryLastQuery = useCallback(() => {
    if (!lastQuery) {
      toast({
        title: "No previous query",
        description: "There is no previous query to retry.",
        variant: "destructive"
      });
      return;
    }
    
    // Add a marker to indicate this is a retry attempt
    const enhancedQuery = `${lastQuery} [RETRY_ATTEMPT]`;
    
    setInput(lastQuery);
    setTimeout(() => {
      if (processQueryRef.current) {
        processQueryRef.current(enhancedQuery);
      }
    }, 100);
  }, [lastQuery, setInput, toast]);

  return { 
    retryLastQuery, 
    setProcessQueryFn, 
    setLastContext,
    lastContext: lastContextRef.current 
  };
};
