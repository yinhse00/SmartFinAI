
export const useQueryBuilder = () => {
  const buildResponseParams = (
    queryText: string, 
    temperature: number, 
    maxTokens: number
  ) => {
    // Enhance query to explicitly request complete responses
    const enhancedQuery = `${queryText.trim()}. Please ensure to include a clear conclusion or summary section at the end of your response that ties everything together. Your response must be complete and well-structured.`;
    
    const responseParams: any = {
      prompt: enhanceQueryWithKeyTerms(enhancedQuery),
      temperature: temperature,
      maxTokens: maxTokens
    };
    
    return responseParams;
  };

  const enhanceQueryWithKeyTerms = (queryText: string): string => {
    const normalizedQuery = queryText.toLowerCase();
    
    // For prospectus/IPO related queries, ensure we get complete responses
    if (normalizedQuery.includes('ipo') || normalizedQuery.includes('prospectus') || 
        normalizedQuery.includes('listing')) {
      let enhancedQuery = queryText;
      
      // Add specific requirements for structure and completeness
      if (!normalizedQuery.includes('conclusion') && !normalizedQuery.includes('summary')) {
        enhancedQuery += " Please structure your response with: 1) A clear explanation of the requirements, 2) Analysis of the specific situation, 3) A conclusion that directly addresses whether the requirements are met. Ensure completeness without truncation.";
      }
      
      // Ensure key aspects are covered for management continuity
      if (normalizedQuery.includes('management continuity')) {
        enhancedQuery += " In your response, address: the minimum required period of management continuity, the acceptable number of management members, and specifically conclude whether the situation meets the requirements.";
      }
      
      return enhancedQuery;
    }
    
    // For all other queries, ensure we get complete responses
    return `${queryText} Please provide a comprehensive response with a clear conclusion section that summarizes all key points.`;
  };
  
  return {
    buildResponseParams
  };
};
