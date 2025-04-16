
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
    // Super aggressive token scaling for faster convergence to complete responses
    // Use multipliers of 6x and 10x to almost guarantee complete responses
    const tokenMultiplier = retryCount === 0 ? 6 : (retryCount === 1 ? 10 : 15);
    const increasedTokens = Math.floor(responseParams.maxTokens * tokenMultiplier);
    
    // Aggressive temperature reduction for more reliable outputs
    const temperatureReduction = retryCount === 0 ? 0.5 : (retryCount === 1 ? 0.2 : 0.1);
    const reducedTemperature = Math.max(0.01, responseParams.temperature * temperatureReduction);
    
    // Create enhanced params
    const enhancedParams = {
      ...responseParams,
      maxTokens: increasedTokens,
      temperature: reducedTemperature
    };
    
    // For rights issue aggregation queries, add specific instructions
    if (isAggregationQuery && retryCount === 0) {
      enhancedParams.prompt += " IMPORTANT: You must fully explain the Rule 7.19A aggregation requirements and how the 50% threshold is calculated across multiple rights issues within 12 months. Specify whether previous shareholders' approval affects subsequent rights issues. Include proper rule references and end with a definitive conclusion addressing the approval requirement directly.";
    }
    
    // Special handling for financial comparison queries to ensure completeness
    if ((financialQueryType === 'rights_issue' || 
         financialQueryType.includes('financial') ||
         queryText.toLowerCase().includes('difference')) && 
         retryCount === 2) {  // On final retry (assuming maxRetries is 3)
      
      // For the final retry of a comparison query, explicitly request conclusion
      enhancedParams.prompt = enhancedParams.prompt + 
        " Make sure to include a complete conclusion section that summarizes all key differences and provide a full analysis without any truncation. Be comprehensive and complete.";
    }
    
    // Special handling for timetable queries on final retry
    if ((queryText.toLowerCase().includes('timetable') || 
         queryText.toLowerCase().includes('schedule')) && 
        retryCount === 2) {  // On final retry (assuming maxRetries is 3)
      
      enhancedParams.prompt = enhancedParams.prompt + 
        " Ensure the response contains all dates, trading periods, and a complete timetable without truncation. Be thorough in the response and include all details.";
    }
    
    return enhancedParams;
  };

  const determineMaxRetries = (isSimpleQuery: boolean, isAggregationQuery: boolean): number => {
    // No retries for simple queries, but 3 for complex ones
    // For aggregation queries, ensure at least one retry attempt
    if (isSimpleQuery) {
      return 0;
    } else if (isAggregationQuery) {
      return 3; // Maximum retries for critical aggregation queries
    } else {
      return 3; // Standard for complex financial queries
    }
  };

  return {
    enhanceParamsForRetry,
    determineMaxRetries
  };
};
