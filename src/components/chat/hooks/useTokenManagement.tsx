
import { GrokResponse } from '@/types/grok';

/**
 * Hook for managing token limits and parameters for API requests
 */
export const useTokenManagement = () => {
  const MAX_TOKENS = 8000;  // Reasonable maximum token limit
  
  const enhanceTokenLimits = (
    queryText: string,
    responseParams: any,
    isSimpleQuery: boolean,
    isAggregationQuery: boolean
  ) => {
    // Use more conservative multipliers
    const baseTokenMultiplier = isSimpleQuery ? 2 : 4;
    
    // Calculate tokens with a safe maximum
    const calculatedTokens = Math.min(
      responseParams.maxTokens * baseTokenMultiplier, 
      MAX_TOKENS
    );
    
    responseParams.maxTokens = calculatedTokens;
    
    // Add specific instructions for aggregation-related queries
    if (queryText.toLowerCase().includes('rule 7.19a') || 
        queryText.toLowerCase().includes('aggregate') || 
        queryText.toLowerCase().includes('within 12 months')) {
      
      responseParams.prompt += " Ensure a comprehensive and detailed explanation of the aggregation requirements.";
      
      // Slightly increase max tokens for complex queries, but still within limits
      responseParams.maxTokens = Math.min(responseParams.maxTokens * 1.5, MAX_TOKENS);
    }
    
    // Add forceful completion instruction to all prompts
    responseParams.prompt += " Provide a complete and comprehensive response with extensive details.";
    
    return responseParams;
  };

  return {
    enhanceTokenLimits
  };
};
