
import { GrokResponse } from '@/types/grok';

/**
 * Hook for managing token limits and parameters for API requests
 */
export const useTokenManagement = () => {
  // Increase maximum token limit for better response completeness
  const MAX_TOKENS = 4000;  // Increased from 3000 to allow for more comprehensive responses
  
  const enhanceTokenLimits = (
    queryText: string,
    responseParams: any,
    isSimpleQuery: boolean,
    isAggregationQuery: boolean
  ) => {
    // Use more generous multipliers for definition queries
    const isDefinitionQuery = queryText.toLowerCase().includes('what is') || 
                             queryText.toLowerCase().includes('definition of');
    
    // Higher multiplier for definition queries to ensure completeness
    const baseTokenMultiplier = isDefinitionQuery ? 2.0 : 
                               isSimpleQuery ? 1.0 : 1.2;
    
    // Calculate tokens with an appropriate maximum
    const calculatedTokens = Math.min(
      responseParams.maxTokens * baseTokenMultiplier, 
      MAX_TOKENS
    );
    
    responseParams.maxTokens = calculatedTokens;
    
    // Add specific instructions for definition-related queries
    if (isDefinitionQuery) {
      responseParams.prompt += " For this definition query, provide a comprehensive explanation with relevant regulatory context. Include the formal definition AND practical implications.";
    }
    
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
