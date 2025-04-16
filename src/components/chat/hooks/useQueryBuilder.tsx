
/**
 * Hook for building query parameters
 */
export const useQueryBuilder = () => {
  const buildResponseParams = (
    queryText: string, 
    temperature: number, 
    maxTokens: number, 
    regulatoryContext: string | undefined
  ) => {
    const responseParams: any = {
      prompt: enhanceQueryWithKeyTerms(queryText),
      temperature: temperature,
      maxTokens: maxTokens
    };
    
    if (regulatoryContext) {
      responseParams.regulatoryContext = regulatoryContext;
    }
    
    return responseParams;
  };

  /**
   * Enhances query text with key terms that might be missing to ensure complete responses
   */
  const enhanceQueryWithKeyTerms = (queryText: string): string => {
    const normalizedQuery = queryText.toLowerCase();
    
    // For rights issue queries, ensure we ask for essential elements
    if (normalizedQuery.includes('rights issue')) {
      // If it's a comparison query, ensure we cover essential elements
      if (normalizedQuery.includes('difference') || normalizedQuery.includes('compare') || 
          normalizedQuery.includes('versus') || normalizedQuery.includes('vs')) {
        
        // Only enhance if the query doesn't already mention these terms
        if (!normalizedQuery.includes('ex-rights') || !normalizedQuery.includes('nil-paid')) {
          return `${queryText} Please include essential elements like ex-rights dates, nil-paid rights trading, and acceptance deadlines in your comprehensive comparison.`;
        }
      }
    }
    
    return queryText;
  };
  
  return {
    buildResponseParams
  };
};
