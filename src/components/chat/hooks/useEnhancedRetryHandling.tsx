
import { GrokResponse } from '@/types/grok';
import { grokService } from '@/services/grokService';

/**
 * Hook for handling retries with progressively enhanced parameters
 */
export const useEnhancedRetryHandling = () => {
  const executeRetryWithEnhancedParams = async (
    responseParams: any,
    retryCount: number,
    maxRetries: number,
    enhanceParamsForRetry: (params: any, retryCount: number, isAggregationQuery: boolean, financialQueryType: string, queryText: string) => any,
    isAggregationQuery: boolean,
    financialQueryType: string,
    queryText: string,
    analyzeResponseCompleteness: (text: string, financialQueryType: string, queryText: string, isSimpleQuery: boolean) => any
  ): Promise<{
    apiResponse: GrokResponse;
    completenessCheck: any;
    retryAttempted: boolean;
  }> => {
    let apiResponse: GrokResponse | null = null;
    let completenessCheck = { isComplete: false, reasons: [], financialAnalysis: { missingElements: [] } };
    let retryAttempted = false;
    
    try {
      // Get enhanced parameters for this retry attempt with more aggressive settings
      const enhancedParams = enhanceParamsForRetry(
        responseParams, 
        retryCount, 
        isAggregationQuery,
        financialQueryType,
        queryText
      );
      
      console.log(`Retry #${retryCount + 1} with tokens: ${enhancedParams.maxTokens}, temperature: ${enhancedParams.temperature}`);
      
      // Execute retry with enhanced parameters
      apiResponse = await grokService.generateResponse(enhancedParams);
      retryAttempted = true;
      console.log(`Retry #${retryCount + 1} completed, checking completeness`);
      
      // Re-analyze completeness with stricter criteria on each retry
      completenessCheck = analyzeResponseCompleteness(
        apiResponse.text, 
        financialQueryType, 
        queryText, 
        false // Force full analysis on retries
      );
      
      console.log(`Retry #${retryCount + 1} result - Complete: ${completenessCheck.isComplete}, Reasons: ${completenessCheck.reasons.join(', ')}`);
    } catch (retryError) {
      console.error(`Retry #${retryCount + 1} failed:`, retryError);
      // Return null response if retry fails
    }
    
    return { apiResponse, completenessCheck, retryAttempted };
  };

  return {
    executeRetryWithEnhancedParams
  };
};
