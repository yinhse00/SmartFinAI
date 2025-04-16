
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
    // More aggressive token scaling for faster convergence
    const tokenMultiplier = retryCount === 0 ? 10 : (retryCount === 1 ? 15 : 20);
    const increasedTokens = Math.floor(responseParams.maxTokens * tokenMultiplier);
    
    // More aggressive temperature reduction for reliable outputs
    const temperatureReduction = retryCount === 0 ? 0.4 : (retryCount === 1 ? 0.2 : 0.1);
    const reducedTemperature = Math.max(0.01, responseParams.temperature * temperatureReduction);
    
    // Create enhanced params with explicit completion instructions
    const enhancedParams = {
      ...responseParams,
      maxTokens: increasedTokens,
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
    
    console.log(`Enhanced retry parameters - Tokens: ${increasedTokens}, Temperature: ${reducedTemperature}`);
    return enhancedParams;
  };

  const determineMaxRetries = (isSimpleQuery: boolean, isAggregationQuery: boolean): number => {
    // Increased retry attempts for better response completeness
    if (isSimpleQuery) {
      return 2; // Two retries even for simple queries
    } else if (isAggregationQuery) {
      return 4; // Maximum 4 retries for critical aggregation queries
    } else {
      return 3; // 3 retries for standard financial queries
    }
  };

  return {
    enhanceParamsForRetry,
    determineMaxRetries
  };
};
