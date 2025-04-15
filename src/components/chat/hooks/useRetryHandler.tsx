
import { useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

/**
 * Hook for handling retry functionality
 */
export const useRetryHandler = (
  lastQuery: string,
  setInput: React.Dispatch<React.SetStateAction<string>>,
  processQuery: (query: string) => Promise<void>
) => {
  const { toast } = useToast();

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
      processQuery(lastQuery);
    }, 100);
  }, [lastQuery, setInput, processQuery, toast]);

  return { retryLastQuery };
};
