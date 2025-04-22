
import { GrokResponse } from '@/types/grok';

export const useRetryStrategies = () => {
  const enhanceParamsForRetry = (
    responseParams: any, 
    retryCount: number
  ) => {
    // More aggressive token scaling - double tokens on first retry, triple on second, etc.
    const tokenMultiplier = retryCount === 0 ? 2 : (retryCount === 1 ? 3 : 4);
    const increasedTokens = Math.floor(responseParams.maxTokens * tokenMultiplier);
    
    // Aggressively reduce temperature on retries
    const reducedTemperature = 0.1; // Fixed low temperature for deterministic results
    
    // Build enhanced parameters for retry
    const enhancedParams = {
      ...responseParams,
      maxTokens: Math.min(increasedTokens, 7000), // Higher token cap for completeness
      temperature: reducedTemperature,
      prompt: responseParams.prompt + 
        " CRITICAL: You MUST provide a COMPLETE and COMPREHENSIVE response. " +
        "For rights issue timetables, include ALL key dates and actions: announcement, EGM, " +
        "record date, commencement of dealings in nil-paid rights, acceptance period start and end, " +
        "results announcement, and refund dates. " +
        "If your response is getting cut off, restart from the beginning to ensure completeness."
    };
    
    // Add specific guidance for rights issue queries
    if (responseParams.prompt?.toLowerCase().includes('rights issue') || 
        (responseParams.financialQueryType === 'rights_issue')) {
      enhancedParams.prompt += " SPECIFICALLY FOR RIGHTS ISSUE TIMETABLES: " +
        "You MUST include all trading dates, nil-paid rights period, acceptance dates, and " +
        "refund information. Ensure the timetable is COMPLETE with a clear structure.";
    }
    
    console.log(`Enhanced Retry Parameters - Tokens: ${enhancedParams.maxTokens}, Temperature: ${enhancedParams.temperature}`);
    return enhancedParams;
  };

  const determineMaxRetries = (isSimpleQuery: boolean, isAggregationQuery: boolean): number => {
    if (isSimpleQuery) return 2; 
    if (isAggregationQuery) return 3;
    return 3; // Standard financial queries get 3 retries
  };

  return {
    enhanceParamsForRetry,
    determineMaxRetries
  };
};
