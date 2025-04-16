
import { GrokResponse } from '@/types/grok';

/**
 * Hook for managing token limits and parameters for API requests
 */
export const useTokenManagement = () => {
  const MAX_TOKENS = 4000;  // Reasonable maximum token limit
  
  const enhanceTokenLimits = (
    queryText: string,
    responseParams: any,
    isSimpleQuery: boolean,
    isAggregationQuery: boolean
  ) => {
    // Use conservative multipliers
    const baseTokenMultiplier = isSimpleQuery ? 1.2 : 1.5;
    
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
      
      responseParams.prompt += " Ensure a comprehensive explanation of the aggregation requirements.";
      
      // Slightly increase max tokens for complex queries, but still within limits
      responseParams.maxTokens = Math.min(responseParams.maxTokens * 1.2, MAX_TOKENS);
    }
    
    // Add completion instruction to all prompts
    responseParams.prompt += " Provide a complete response with necessary details.";
    
    return responseParams;
  };

  return {
    enhanceTokenLimits
  };
};
