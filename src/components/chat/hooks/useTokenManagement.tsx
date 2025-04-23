
import { useCallback } from 'react';

/**
 * Hook for managing token limits and API parameters
 */
export const useTokenManagement = () => {
  const enhanceTokenLimits = useCallback((
    queryText: string,
    responseParams: any,
    isSimpleQuery: boolean,
    isAggregationQuery: boolean
  ) => {
    let enhancedParams = { ...responseParams };
    
    // Base token settings
    const DEFAULT_TOKEN_LIMIT = isSimpleQuery ? 4000 : 6000;
    const COMPLEX_TOKEN_LIMIT = 8000;
    const RETRY_TOKEN_LIMIT = 10000;
    
    // Detect if this is a retry attempt
    const isRetryAttempt = queryText.includes('[RETRY_ATTEMPT]');
    
    // Determine token limit based on query characteristics
    let maxTokens = DEFAULT_TOKEN_LIMIT;
    
    if (isRetryAttempt) {
      // Significantly increase tokens for retry attempts
      maxTokens = RETRY_TOKEN_LIMIT;
      console.log('Using retry token limit:', maxTokens);
    } else if (isAggregationQuery) {
      // Use higher limits for aggregation queries
      maxTokens = COMPLEX_TOKEN_LIMIT;
      console.log('Using aggregation query token limit:', maxTokens);
    } else if (queryText.toLowerCase().includes('timetable') || 
               queryText.toLowerCase().includes('schedule') ||
               queryText.toLowerCase().includes('timeline')) {
      // Timetables/schedules need more tokens to be complete
      maxTokens = COMPLEX_TOKEN_LIMIT;
      console.log('Using timetable query token limit:', maxTokens);
    } else if (queryText.toLowerCase().includes('rights issue') || 
               queryText.toLowerCase().includes('open offer')) {
      // Corporate actions need more complete responses
      maxTokens = COMPLEX_TOKEN_LIMIT - 1000;
      console.log('Using corporate action token limit:', maxTokens);
    } else if (queryText.length > 200) {
      // Longer queries generally need more tokens
      maxTokens = DEFAULT_TOKEN_LIMIT + 1000;
      console.log('Using long query token limit:', maxTokens);
    }
    
    // Override parameters with enhanced values
    enhancedParams.maxTokens = maxTokens;
    
    // Also reduce temperature for retries for more deterministic/complete responses
    if (isRetryAttempt) {
      enhancedParams.temperature = 0.1; // Very low temperature for retries
    } else if (queryText.toLowerCase().includes('timetable') ||
               queryText.toLowerCase().includes('rights issue') ||
               isAggregationQuery) {
      enhancedParams.temperature = 0.2; // Low temperature for precision-critical queries
    }
    
    return enhancedParams;
  }, []);

  return { enhanceTokenLimits };
};
