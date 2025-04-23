
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
      
      // Preserve any context from the original query
      const preservedContext = enhancedParams.regulatoryContext;
      console.log(`Retry attempt ${currentRetryCount + 1}/${maxRetries} with preserved context: ${!!preservedContext}`);
      
      // Enhance parameters for this retry attempt with much higher token limits
      const retryParams = enhanceParamsForRetry(enhancedParams, currentRetryCount);
      
      // Add special markers to indicate this is a retry to help AI understand context
      retryParams.prompt = `[RETRY_ATTEMPT ${currentRetryCount + 1}] ${retryParams.prompt}`;
      
      // Force extremely low temperature on retries for deterministic results
      retryParams.temperature = 0.05;
      
      // Triple the max tokens on retry for completeness
      retryParams.maxTokens = Math.min(12000, retryParams.maxTokens * 3);
      
      // Use specialized retry prompting based on query type
      if (financialQueryType === 'rights_issue' && queryText.toLowerCase().includes('timetable')) {
        retryParams.prompt = `I need a COMPLETE rights issue timetable with ALL key dates and actions. ${retryParams.prompt}`;
      } else if (isAggregationQuery) {
        retryParams.prompt = `I need a COMPLETE explanation of the aggregation rule with ALL requirements and thresholds. ${retryParams.prompt}`;
      } else if (queryText.toLowerCase().includes('connected transaction')) {
        retryParams.prompt = `I need a COMPLETE explanation of connected transactions with ALL categories and thresholds. ${retryParams.prompt}`;
      }
      
      console.log(`Enhanced Retry Parameters - Tokens: ${retryParams.maxTokens}, Temperature: ${retryParams.temperature}`);
      
      // Use a different format instruction for retries
      retryParams.prompt += " FORMAT INSTRUCTION: Present the most critical information first. Use bullet points and tables where appropriate to be concise.";
      
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
      
      console.log(`Retry completeness check - Complete: ${retryCompletenessCheck.isComplete}, Reasons: ${retryCompletenessCheck.reasons?.join(', ') || 'None'}`);
      
      // If retry is still incomplete but better than original (longer), use it anyway
      if (!retryCompletenessCheck.isComplete && retryResponse.text.length > 2000) {
        console.log('Using partial retry response as it contains some information');
        retryCompletenessCheck.partialSuccess = true;
      }
      
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
