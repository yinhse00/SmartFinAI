
import { GrokResponse } from '@/types/grok';
import { useState, useCallback } from 'react';
import { grokService } from '@/services/grokService';
import { useFallbackDetection } from './useFallbackDetection';
import { useToast } from '@/hooks/use-toast';

/**
 * Hook for enhanced retry handling with improved context and token management
 */
export const useEnhancedRetryHandling = () => {
  const [retryCount, setRetryCount] = useState(0);
  const { isFallbackResponse } = useFallbackDetection();
  const { toast } = useToast();
  
  const executeRetryWithEnhancedParams = useCallback(async (
    enhancedParams: any,
    currentRetryCount: number,
    maxRetries: number,
    enhanceParamsForRetry: (params: any, retryCount: number) => any,
    isAggregationQuery: boolean,
    financialQueryType: string,
    queryText: string,
    analyzeResponseCompleteness: (text: string, type: string, query: string, isSimple: boolean) => any
  ) => {
    try {
      // Track this retry attempt
      setRetryCount(currentRetryCount + 1);
      
      // Enhance parameters for this retry attempt - use local enhanceParamsForRetry that takes only needed parameters
      const retryParams = enhanceParamsForRetry(enhancedParams, currentRetryCount);
      
      // Log retry information
      console.log(`Retry attempt ${currentRetryCount + 1}/${maxRetries} with ${retryParams.maxTokens} tokens and temperature ${retryParams.temperature}`);
      
      // Make the API call with enhanced parameters
      const retryResponse: GrokResponse = await grokService.generateResponse(retryParams);
      
      // Check if this is a fallback response
      const isUsingFallback = isFallbackResponse(retryResponse.text);
      
      if (isUsingFallback) {
        console.log('Retry resulted in fallback response, not using');
        
        // Make the fallback visible in both environments for consistency
        toast({
          title: "Enhanced Response Failed",
          description: "Couldn't generate a complete response. Using available information.",
          variant: "destructive"
        });
        
        // Return that we attempted but don't use the fallback response
        return {
          retryAttempted: true,
          apiResponse: null,
          completenessCheck: { 
            isComplete: false, 
            reasons: ['Retry resulted in fallback response'],
            financialAnalysis: { isComplete: false, missingElements: ['Complete response unavailable'] }
          }
        };
      }
      
      // Check if the retry response is complete
      const retryCompletenessCheck = analyzeResponseCompleteness(
        retryResponse.text,
        financialQueryType,
        queryText,
        false // Never treat retries as simple queries
      );
      
      console.log(`Retry completeness check - Complete: ${retryCompletenessCheck.isComplete}, Reasons: ${retryCompletenessCheck.reasons.join(', ')}`);
      
      return {
        retryAttempted: true,
        apiResponse: retryResponse,
        completenessCheck: retryCompletenessCheck
      };
    } catch (error) {
      console.error('Error during retry attempt:', error);
      
      return {
        retryAttempted: true,
        apiResponse: null,
        completenessCheck: { 
          isComplete: false, 
          reasons: ['Error during retry attempt'],
          financialAnalysis: { isComplete: false, missingElements: ['Error during retry'] }
        }
      };
    }
  }, [toast, isFallbackResponse]);
  
  return {
    retryCount,
    executeRetryWithEnhancedParams
  };
};
