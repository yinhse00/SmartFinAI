
import { GrokResponse } from '@/types/grok';

export const useRetryStrategies = () => {
  const enhanceParamsForRetry = (
    responseParams: any, 
    retryCount: number
  ) => {
    // More aggressive token scaling
    const tokenMultiplier = retryCount === 0 ? 2 : (retryCount === 1 ? 3 : 4);
    const increasedTokens = Math.floor(responseParams.maxTokens * tokenMultiplier);
    
    // More aggressive temperature reduction
    const temperatureReduction = retryCount === 0 ? 0.7 : (retryCount === 1 ? 0.5 : 0.3);
    const reducedTemperature = Math.max(0.01, responseParams.temperature * temperatureReduction);
    
    const enhancedParams = {
      ...responseParams,
      maxTokens: Math.min(increasedTokens, 6000), // Increased max token cap
      temperature: reducedTemperature,
      prompt: responseParams.prompt + 
        " CRITICAL: You MUST provide a COMPLETE and COMPREHENSIVE response. " +
        "If your response is getting cut off, restart from the last complete section. " +
        "Ensure a clear conclusion that summarizes all key points."
    };
    
    console.log(`Enhanced Retry Parameters - Tokens: ${enhancedParams.maxTokens}, Temperature: ${enhancedParams.temperature}`);
    return enhancedParams;
  };

  const determineMaxRetries = (isSimpleQuery: boolean, isAggregationQuery: boolean): number => {
    if (isSimpleQuery) return 2; // Increased from 1
    if (isAggregationQuery) return 3; // Increased from 2
    return 3; // Standard financial queries now get 3 retries
  };

  return {
    enhanceParamsForRetry,
    determineMaxRetries
  };
};
