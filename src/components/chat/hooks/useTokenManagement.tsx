
import { GrokResponse } from '@/types/grok';

/**
 * Hook for managing token limits and parameters for API requests
 */
export const useTokenManagement = () => {
  // Lower maximum token limit to ensure complete responses
  const MAX_TOKENS = 3000;  // Reduced from 4000 for better reliability
  
  const enhanceTokenLimits = (
    queryText: string,
    responseParams: any,
    isSimpleQuery: boolean,
    isAggregationQuery: boolean
  ) => {
    // Use more conservative multipliers to avoid truncation
    const baseTokenMultiplier = isSimpleQuery ? 1.0 : 1.2; // Reduced from 1.2/1.5
    
    // Calculate tokens with a safer maximum
    const calculatedTokens = Math.min(
      responseParams.maxTokens * baseTokenMultiplier, 
      MAX_TOKENS
    );
    
    responseParams.maxTokens = calculatedTokens;
    
    // Add specific instructions for aggregation-related queries
    if (queryText.toLowerCase().includes('rule 7.19a') || 
        queryText.toLowerCase().includes('aggregate') || 
        queryText.toLowerCase().includes('within 12 months')) {
      
      responseParams.prompt += " Ensure a comprehensive but concise explanation of the aggregation requirements.";
      
      // Use same token limit but prioritize conciseness
      responseParams.prompt += " Focus on clarity and brevity while covering all key points.";
    }
    
    // Add completion instruction to all prompts with emphasis on completeness
    responseParams.prompt += " Provide a complete response with necessary details. Be concise and prioritize completeness over verbosity.";
    
    return responseParams;
  };

  return {
    enhanceTokenLimits
  };
};
