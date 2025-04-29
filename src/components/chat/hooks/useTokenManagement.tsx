
import { useCallback } from 'react';
import { tokenManagementService } from '@/services/response/modules/tokenManagementService';

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
    
    // Use token limits from centralized token management service
    const isRetryAttempt = queryText.includes('[RETRY_ATTEMPT]');
    
    // Determine query type from context
    let queryType = 'general';
    
    if (isAggregationQuery) {
      queryType = 'aggregation';
    } else if (queryText.toLowerCase().includes('rights issue')) {
      queryType = 'rights_issue';
    } else if (queryText.toLowerCase().includes('connected transaction')) {
      queryType = 'connected_transaction';
    } else if (queryText.toLowerCase().includes('timetable') || 
               queryText.toLowerCase().includes('schedule') ||
               queryText.toLowerCase().includes('timeline')) {
      queryType = 'timetable';
    } else if (isSimpleQuery) {
      queryType = 'simple';
    }
    
    // Get token limit from service
    const maxTokens = tokenManagementService.getTokenLimit({
      queryType,
      isRetryAttempt,
      prompt: queryText,
      isSimpleQuery
    });
    
    console.log(`Using token limit for ${queryType} query: ${maxTokens}`);
    
    // Override parameters with enhanced values
    enhancedParams.maxTokens = maxTokens;
    
    // Get temperature from service
    enhancedParams.temperature = tokenManagementService.getTemperature({
      queryType,
      isRetryAttempt,
      prompt: queryText
    });
    
    return enhancedParams;
  }, []);

  return { enhanceTokenLimits };
};
