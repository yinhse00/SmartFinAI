
import { useCallback, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import { getFreshGrokApiKey } from '@/services/apiKeyService';

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
    useGuideReferenceEnhancement?: boolean;
  }>({});

  const setProcessQueryFn = useCallback((processQueryFn: (query: string) => Promise<void>) => {
    processQueryRef.current = processQueryFn;
  }, []);
  
  const setLastContext = useCallback((context: {
    regulatoryContext?: string;
    reasoning?: string;
    financialQueryType?: string;
    useGuideReferenceEnhancement?: boolean;
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
    
    // Get a fresh API key for the retry to prevent overloading any single key
    const freshKey = getFreshGrokApiKey();
    console.log("Using fresh API key for retry:", freshKey.substring(0, 6) + "***");
    
    // Add markers to indicate this is a retry attempt with guide emphasis
    let enhancedQuery = `${lastQuery} [RETRY_ATTEMPT]`;
    
    // For trading arrangement related queries, add special enhancement
    if (lastContextRef.current.financialQueryType && 
        ['rights_issue', 'open_offer', 'share_consolidation', 
         'board_lot_change', 'company_name_change'].includes(lastContextRef.current.financialQueryType)) {
      enhancedQuery += " [FOLLOW_TRADING_GUIDE_STRICTLY]";
      lastContextRef.current.useGuideReferenceEnhancement = true;
      console.log("Enhanced retry with trading guide reference requirement");
    }
    
    setInput(lastQuery);
    setTimeout(() => {
      if (processQueryRef.current) {
        console.log("Retrying query with higher token limits, fresh API key, and enhanced guide adherence");
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
