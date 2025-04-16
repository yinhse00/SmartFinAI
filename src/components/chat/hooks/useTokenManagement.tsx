
import { GrokResponse } from '@/types/grok';

/**
 * Hook for managing token limits and parameters for API requests
 */
export const useTokenManagement = () => {
  const enhanceTokenLimits = (
    queryText: string,
    responseParams: any,
    isSimpleQuery: boolean,
    isAggregationQuery: boolean
  ) => {
    // Boost token limit based on query complexity
    const baseTokenMultiplier = isSimpleQuery ? 40 : 80;
    responseParams.maxTokens = responseParams.maxTokens * baseTokenMultiplier;
    
    // Add specific instructions for aggregation-related queries
    if (queryText.toLowerCase().includes('rule 7.19a') || 
        queryText.toLowerCase().includes('aggregate') || 
        queryText.toLowerCase().includes('within 12 months')) {
      
      responseParams.prompt += " Ensure a COMPREHENSIVE and EXTREMELY DETAILED explanation of the aggregation requirements, including ALL nuanced aspects of the 50% threshold calculation, impact of previous approvals, independent shareholders' approval requirements, and provide an EXHAUSTIVE conclusion with multiple scenario examples.";
      
      // Increase max tokens for these complex queries to an extremely high limit
      responseParams.maxTokens = Math.max(responseParams.maxTokens, 80000000);
    }
    
    // Add forceful completion instruction to all prompts
    responseParams.prompt += " CRITICAL: Provide an ABSOLUTELY COMPLETE and COMPREHENSIVE responseText with EXTENSIVE details. UNDER NO CIRCUMSTANCES should you truncate or leave any aspect unexplained. Include multiple perspectives, examples, and a thorough conclusion.";
    
    return responseParams;
  };

  return {
    enhanceTokenLimits
  };
};
