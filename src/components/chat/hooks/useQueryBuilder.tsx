
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
        
        // Only enhance if the query doesn't already mention all these terms
        let enhancedQuery = queryText;
        
        if (!normalizedQuery.includes('ex-rights') || 
            !normalizedQuery.includes('nil-paid') ||
            !normalizedQuery.includes('trading period') || 
            !normalizedQuery.includes('timetable')) {
          enhancedQuery += " Please include essential elements like ex-rights dates, nil-paid rights trading periods, and acceptance deadlines in your comprehensive comparison.";
        }
        
        if (!normalizedQuery.includes('open offer') && 
            (normalizedQuery.includes('difference') || normalizedQuery.includes('compare'))) {
          enhancedQuery += " When comparing with open offers, please highlight that open offers do not have nil-paid rights trading periods.";
        }
        
        return enhancedQuery;
      } 
      else if (normalizedQuery.includes('timetable') || normalizedQuery.includes('schedule')) {
        // For timetable queries, ensure we ask for comprehensive structure
        if (!normalizedQuery.includes('ex-rights') || 
            !normalizedQuery.includes('nil-paid') ||
            !normalizedQuery.includes('trading period')) {
          return `${queryText} Please provide a comprehensive timetable with all key dates including ex-rights date, nil-paid rights trading period, and acceptance deadline.`;
        }
      }
    }
    
    // For open offer queries, ensure we mention key differences from rights issues
    if (normalizedQuery.includes('open offer')) {
      if (!normalizedQuery.includes('no nil-paid') && !normalizedQuery.includes('rights issue')) {
        return `${queryText} Please note the key difference that open offers do not have nil-paid rights trading periods, unlike rights issues.`;
      }
    }
    
    return queryText;
  };
  
  return {
    buildResponseParams
  };
};
