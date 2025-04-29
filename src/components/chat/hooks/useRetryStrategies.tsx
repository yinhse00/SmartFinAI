
import { GrokResponse } from '@/types/grok';
import { tokenManagementService } from '@/services/response/modules/tokenManagementService';

export const useRetryStrategies = () => {
  const enhanceParamsForRetry = (
    responseParams: any, 
    retryCount: number
  ) => {
    // Get token limit for retry from service
    const queryType = responseParams.financialQueryType || 'general';
    const prompt = responseParams.prompt || '';
    
    // Use the service to get the retry token limit
    const increasedTokens = tokenManagementService.getTokenLimit({
      queryType,
      isRetryAttempt: true,
      prompt,
      retryCount
    });

    // Use extremely low temperature on retries for maximum determinism
    const reducedTemperature = 0.05;

    // Build enhanced parameters for retry with specialized prompting techniques
    const enhancedParams = {
      ...responseParams,
      maxTokens: increasedTokens,
      temperature: reducedTemperature,
      prompt: responseParams.prompt +
        " CRITICAL: This is a RETRY attempt. You MUST provide a COMPLETE and COMPREHENSIVE response. " +
        "DO NOT truncate your response. For timetables, include ALL key dates and actions. " +
        "For regulatory content, include ALL relevant rules and requirements. " +
        "For comparative analysis, include COMPLETE information for all compared items. " +
        "If your response needs to be detailed, START with the most important information. " +
        "Format efficiently using bullet points and tables where appropriate to fit more information."
    };

    if (responseParams.prompt?.toLowerCase().includes('rights issue') ||
        (responseParams.financialQueryType === 'rights_issue')) {
      enhancedParams.prompt += " FOR RIGHTS ISSUE TIMETABLES: " +
        "You MUST include ALL trading dates and nil-paid rights period in a well-structured table format. " +
        "Present the timetable first before any explanations.";
    } else if (responseParams.prompt?.toLowerCase().includes('connected transaction') ||
              (responseParams.financialQueryType === 'connected_transaction')) {
      enhancedParams.prompt += " FOR CONNECTED TRANSACTIONS: " +
        "List ALL categories of connected persons and transaction thresholds at the beginning of your response.";
    }

    console.log(`Enhanced Retry Parameters - Tokens: ${enhancedParams.maxTokens}, Temperature: ${enhancedParams.temperature}, Retry #${retryCount+1}`);
    return enhancedParams;
  };

  const determineMaxRetries = (isSimpleQuery: boolean, isAggregationQuery: boolean): number => {
    if (isSimpleQuery) return 1;
    if (isAggregationQuery) return 3;
    return 2;
  };

  return {
    enhanceParamsForRetry,
    determineMaxRetries
  };
};
