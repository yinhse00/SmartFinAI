
import { useCallback, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';

/**
 * Hook for handling retry functionality
 */
export const useRetryHandler = (
  lastQuery: string,
  setInput: React.Dispatch<React.SetStateAction<string>>
) => {
  const { toast } = useToast();
  const processQueryRef = useRef<(query: string) => Promise<void>>();

  const setProcessQueryFn = useCallback((processQueryFn: (query: string) => Promise<void>) => {
    processQueryRef.current = processQueryFn;
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
    
    setInput(lastQuery);
    setTimeout(() => {
      if (processQueryRef.current) {
        processQueryRef.current(lastQuery);
      }
    }, 100);
  }, [lastQuery, setInput, toast]);

  return { retryLastQuery, setProcessQueryFn };
};
