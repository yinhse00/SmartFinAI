
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
    // More efficient token scaling for faster convergence
    const tokenMultiplier = retryCount === 0 ? 3 : (retryCount === 1 ? 5 : 8);
    const increasedTokens = Math.floor(responseParams.maxTokens * tokenMultiplier);
    
    // More aggressive temperature reduction for reliable outputs
    const temperatureReduction = retryCount === 0 ? 0.7 : (retryCount === 1 ? 0.4 : 0.2);
    const reducedTemperature = Math.max(0.01, responseParams.temperature * temperatureReduction);
    
    // Create enhanced params
    const enhancedParams = {
      ...responseParams,
      maxTokens: increasedTokens,
      temperature: reducedTemperature
    };
    
    // For rights issue aggregation queries, add specific instructions
    if (isAggregationQuery && retryCount === 0) {
      enhancedParams.prompt += " IMPORTANT: Fully explain Rule 7.19A aggregation requirements and 50% threshold calculation across multiple rights issues within 12 months. Address shareholder approval requirements directly.";
    }
    
    // Special handling for financial comparison queries to ensure completeness
    if ((financialQueryType === 'rights_issue' || 
         financialQueryType.includes('financial') ||
         queryText.toLowerCase().includes('difference')) && 
         retryCount === 1) {  // On second retry
      
      // For the final retry of a comparison query, explicitly request conclusion
      enhancedParams.prompt = enhancedParams.prompt + 
        " Ensure your response includes a complete conclusion section summarizing key differences.";
    }
    
    return enhancedParams;
  };

  const determineMaxRetries = (isSimpleQuery: boolean, isAggregationQuery: boolean): number => {
    // Reduced retry attempts for better user experience
    if (isSimpleQuery) {
      return 0; // No retries for simple queries
    } else if (isAggregationQuery) {
      return 2; // Maximum 2 retries for critical aggregation queries
    } else {
      return 1; // Only 1 retry for standard financial queries
    }
  };

  return {
    enhanceParamsForRetry,
    determineMaxRetries
  };
};
