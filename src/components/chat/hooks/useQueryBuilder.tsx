
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
          enhancedQuery += " Please include essential elements like ex-rights dates, nil-paid rights trading periods, acceptance deadlines, and complete timetable structures in your comprehensive comparison.";
        }
        
        if (!normalizedQuery.includes('open offer') && 
            (normalizedQuery.includes('difference') || normalizedQuery.includes('compare'))) {
          enhancedQuery += " When comparing with open offers, please highlight that open offers do not have nil-paid rights trading periods.";
        }

        if (!normalizedQuery.includes('conclusion') && !normalizedQuery.includes('summary')) {
          enhancedQuery += " Please include a conclusion section that summarizes the key differences. Ensure your response is complete without truncation.";
        }
        
        // Add specific request for complete response
        enhancedQuery += " Make sure to provide a complete response without truncation, covering all aspects fully.";
        
        return enhancedQuery;
      } 
      else if (normalizedQuery.includes('timetable') || normalizedQuery.includes('schedule')) {
        // For timetable queries, ensure we ask for comprehensive structure
        let enhancedQuery = queryText;
        
        if (!normalizedQuery.includes('ex-rights') || 
            !normalizedQuery.includes('nil-paid') ||
            !normalizedQuery.includes('trading period')) {
          enhancedQuery += " Please provide a comprehensive timetable with all key dates including ex-rights date, nil-paid rights trading period, and acceptance deadline.";
        }
        
        if (!normalizedQuery.includes('conclusion') && !normalizedQuery.includes('summary')) {
          enhancedQuery += " Please include a conclusion or summary section after presenting the timetable.";
        }
        
        // Add specific request for complete response
        enhancedQuery += " Please ensure your response is complete and covers all relevant events in the timetable without truncation.";
        
        return enhancedQuery;
      }
      
      // General rights issue query
      let enhancedQuery = queryText;
      // Add specific request for complete response
      enhancedQuery += " Please provide a comprehensive response that covers all aspects of rights issues including trading arrangements without truncation.";
      return enhancedQuery;
    }
    
    // For open offer queries, ensure we mention key differences from rights issues
    if (normalizedQuery.includes('open offer')) {
      let enhancedQuery = queryText;
      
      if (!normalizedQuery.includes('no nil-paid') && !normalizedQuery.includes('rights issue')) {
        enhancedQuery += " Please note the key difference that open offers do not have nil-paid rights trading periods, unlike rights issues.";
      }
      
      if (normalizedQuery.includes('timetable') || normalizedQuery.includes('schedule')) {
        if (!normalizedQuery.includes('conclusion') && !normalizedQuery.includes('summary')) {
          enhancedQuery += " Please include a conclusion or summary section after presenting the timetable.";
        }
      }
      
      // Add specific request for complete response
      enhancedQuery += " Please ensure your response is complete and covers all aspects thoroughly without truncation.";
      
      return enhancedQuery;
    }
    
    // For general comparison queries, ensure we ask for a conclusion
    if (normalizedQuery.includes('difference') || normalizedQuery.includes('compare') || 
        normalizedQuery.includes('versus') || normalizedQuery.includes('vs')) {
      let enhancedQuery = queryText;
      
      if (!normalizedQuery.includes('conclusion') && !normalizedQuery.includes('summary')) {
        enhancedQuery += " Please include a conclusion section that summarizes the key differences.";
      }
      
      // Add specific request for complete response
      enhancedQuery += " Please provide a comprehensive comparison without truncation, ensuring all aspects are covered thoroughly.";
      
      return enhancedQuery;
    }
    
    // For any other query, add a general request for completeness
    return `${queryText} Please provide a comprehensive and complete response without truncation.`;
  };
  
  return {
    buildResponseParams
  };
};
