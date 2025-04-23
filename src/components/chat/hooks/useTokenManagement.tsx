
import { tokenManagementService } from '@/services/response/modules/tokenManagementService';

export const useTokenManagement = () => {
  const enhanceTokenLimits = (
    queryText: string,
    responseParams: any,
    isSimpleQuery: boolean,
    isAggregationQuery: boolean
  ) => {
    // Get base token limit
    const baseTokenLimit = tokenManagementService.getTokenLimit({
      queryType: responseParams.financialQueryType || 'general',
      prompt: queryText,
      isSimpleQuery
    });
    
    // Increase token limit for complex queries
    let tokenLimit = baseTokenLimit;
    if (isAggregationQuery) {
      tokenLimit = Math.min(tokenLimit * 1.5, 8000); // Cap at 8000 for aggregation queries
    } else if (queryText.toLowerCase().includes('timetable') || 
               queryText.toLowerCase().includes('schedule') ||
               queryText.toLowerCase().includes('detailed') ||
               queryText.toLowerCase().includes('comprehensive')) {
      tokenLimit = Math.min(tokenLimit * 1.25, 7000); // Cap at 7000 for timetable/detailed queries
    }
    
    // For comparison queries
    if (queryText.toLowerCase().includes('difference between') ||
        queryText.toLowerCase().includes('compare')) {
      tokenLimit = Math.min(tokenLimit * 1.2, 6500); // Cap at 6500 for comparison queries
    }

    // Get appropriate temperature
    const temperature = tokenManagementService.getTemperature({
      queryType: responseParams.financialQueryType || 'general',
      prompt: queryText
    });

    console.log(`Enhanced token limit: ${tokenLimit}, Temperature: ${temperature}`);

    return {
      ...responseParams,
      maxTokens: tokenLimit,
      temperature
    };
  };

  return {
    enhanceTokenLimits
  };
};
