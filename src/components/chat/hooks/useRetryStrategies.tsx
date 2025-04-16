
/**
 * Hook for handling retry strategies for incomplete responses
 */
export const useRetryStrategies = () => {
  const enhanceParamsForRetry = (
    responseParams: any, 
    retryCount: number, 
    isAggregationQuery: boolean,
    financialQueryType: string,
    queryText: string
  ) => {
    // More reasonable token scaling for faster convergence
    const tokenMultiplier = retryCount === 0 ? 1.5 : (retryCount === 1 ? 2 : 3);
    const increasedTokens = Math.floor(responseParams.maxTokens * tokenMultiplier);
    
    // More aggressive temperature reduction for reliable outputs
    const temperatureReduction = retryCount === 0 ? 0.8 : (retryCount === 1 ? 0.6 : 0.4);
    const reducedTemperature = Math.max(0.01, responseParams.temperature * temperatureReduction);
    
    // Create enhanced params with explicit completion instructions
    const enhancedParams = {
      ...responseParams,
      maxTokens: Math.min(increasedTokens, 4000), // Cap at 4000 tokens
      temperature: reducedTemperature,
      prompt: responseParams.prompt + " CRITICAL: You MUST provide a complete response with all necessary information and a clear conclusion. DO NOT truncate your response."
    };
    
    // For rights issue aggregation queries, add specific instructions
    if (isAggregationQuery && retryCount === 0) {
      enhancedParams.prompt += " IMPORTANT: Fully explain Rule 7.19A aggregation requirements and 50% threshold calculation across multiple rights issues within 12 months. Address shareholder approval requirements directly and provide a clear conclusion.";
    }
    
    // Special handling for financial comparison queries to ensure completeness
    if ((financialQueryType === 'rights_issue' || 
         financialQueryType.includes('financial') ||
         queryText.toLowerCase().includes('difference')) && 
         retryCount === 1) {  // On second retry
      
      // For the final retry of a comparison query, explicitly request conclusion
      enhancedParams.prompt = enhancedParams.prompt + 
        " Ensure your response includes a complete conclusion section summarizing key differences and recommendations.";
    }
    
    console.log(`Enhanced retry parameters - Tokens: ${enhancedParams.maxTokens}, Temperature: ${enhancedParams.temperature}`);
    return enhancedParams;
  };

  const determineMaxRetries = (isSimpleQuery: boolean, isAggregationQuery: boolean): number => {
    // Increased retry attempts for better response completeness
    if (isSimpleQuery) {
      return 1; // One retry for simple queries
    } else if (isAggregationQuery) {
      return 2; // Maximum 2 retries for critical aggregation queries
    } else {
      return 2; // 2 retries for standard financial queries
    }
  };

  return {
    enhanceParamsForRetry,
    determineMaxRetries
  };
};
