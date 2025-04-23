
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

    // Significantly boost tokens for queries that are likely to require comprehensive responses
    if (isAggregationQuery) {
      tokenLimit = Math.min(tokenLimit * 2, 8000); // More aggressive cap for aggregation queries
    } else if (queryText.toLowerCase().includes('timetable') || 
               queryText.toLowerCase().includes('schedule')) {
      tokenLimit = Math.min(tokenLimit * 1.5, 7500); // Higher cap for timetable/schedule queries
    } else if (queryText.toLowerCase().includes('detailed') ||
               queryText.toLowerCase().includes('comprehensive') ||
               queryText.toLowerCase().includes('complete')) {
      tokenLimit = Math.min(tokenLimit * 1.4, 7000); // Higher cap for detailed requests
    }
    
    // Additional boost for comparison and difference queries
    if (queryText.toLowerCase().includes('difference between') ||
        queryText.toLowerCase().includes('compare') ||
        queryText.toLowerCase().includes('versus') ||
        queryText.toLowerCase().includes('vs')) {
      tokenLimit = Math.min(tokenLimit * 1.3, 7000); // Higher cap for comparison queries
    }
    
    // Further boost for specific financial terms that likely require detailed explanations
    if (queryText.toLowerCase().includes('connected transaction') ||
        queryText.toLowerCase().includes('whitewash waiver') ||
        queryText.toLowerCase().includes('rule 7.19a') ||
        queryText.toLowerCase().includes('chapter 14a')) {
      tokenLimit = Math.min(tokenLimit * 1.25, 7500); // Domain-specific boosts
    }

    // Get appropriate temperature - lower temperature for more deterministic responses
    const temperature = tokenManagementService.getTemperature({
      queryType: responseParams.financialQueryType || 'general',
      prompt: queryText
    });

    console.log(`Enhanced token limit: ${tokenLimit}, Temperature: ${temperature}, Simple query: ${isSimpleQuery}`);

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
