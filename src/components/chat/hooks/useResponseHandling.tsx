
import { useToast } from '@/hooks/use-toast';
import { grokService } from '@/services/grokService';
import { Message } from '../ChatMessage';
import { useResponseFormatter } from './useResponseFormatter';
import { useErrorHandling } from './useErrorHandling';
import { useResponseAnalysis } from './useResponseAnalysis';
import { useRetryStrategies } from './useRetryStrategies';
import { useFallbackDetection } from './useFallbackDetection';
import { GrokResponse } from '@/types/grok';
import { useTokenManagement } from './useTokenManagement';
import { useEnhancedRetryHandling } from './useEnhancedRetryHandling';
import { useResponseProcessor } from './useResponseProcessor';

/**
 * Hook for handling API responses with massively increased token limits
 */
export const useResponseHandling = (
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>,
  retryLastQuery: () => void,
  isGrokApiKeySet: boolean
) => {
  const { toast } = useToast();
  const { handleApiError, handleFallbackResponse } = useErrorHandling();
  const { analyzeResponseCompleteness, isQuerySimple, isQueryAggregationRelated } = useResponseAnalysis();
  const { enhanceParamsForRetry, determineMaxRetries } = useRetryStrategies();
  const { isFallbackResponse } = useFallbackDetection();
  const { enhanceTokenLimits } = useTokenManagement();
  const { executeRetryWithEnhancedParams } = useEnhancedRetryHandling();
  const { processApiResponse } = useResponseProcessor(setMessages, retryLastQuery);

  const handleApiResponse = async (
    queryText: string,
    responseParams: any,
    regulatoryContext: string | undefined,
    reasoning: string | undefined,
    financialQueryType: string,
    processedMessages: Message[]
  ) => {
    try {
      console.log('Calling Grok financial expert API');
      
      // Determine if this is a simple conversational query
      const isSimpleQuery = isQuerySimple(queryText);
      
      // Determine if this is an aggregation query for special handling
      const isAggregationQuery = isQueryAggregationRelated(queryText);
      
      // Apply token limits and enhancements
      const enhancedParams = enhanceTokenLimits(queryText, responseParams, isSimpleQuery, isAggregationQuery);
      
      // First attempt with significantly increased token limits
      console.log(`Initial request with tokens: ${enhancedParams.maxTokens}, temperature: ${enhancedParams.temperature}`);
      
      // Make the initial API call
      let apiResponse: GrokResponse = await grokService.generateResponse(enhancedParams);
      
      // Check if it's using fallback
      const isUsingFallback = isFallbackResponse(apiResponse.text);
      
      if (isUsingFallback && isGrokApiKeySet) {
        handleFallbackResponse(isGrokApiKeySet);
      }
      
      // Analyze responseText completeness
      let completenessCheck = analyzeResponseCompleteness(
        apiResponse.text, 
        financialQueryType, 
        queryText, 
        isSimpleQuery
      );
      
      // Determine maximum retries based on query complexity
      const maxRetries = determineMaxRetries(isSimpleQuery, isAggregationQuery);
      let retryCount = 0;
      
      // Log the completeness check results
      console.log(`Response completeness check - Complete: ${completenessCheck.isComplete}, Reasons: ${completenessCheck.reasons.join(', ')}`);
      
      // Retry logic for incomplete responseTexts - more aggressive approach
      while (retryCount < maxRetries && !completenessCheck.isComplete && !isUsingFallback && isGrokApiKeySet) {
        console.log(`Response appears incomplete (attempt ${retryCount + 1}/${maxRetries}), retrying with enhanced parameters`);
        
        // Execute retry with enhanced parameters
        const retryResult = await executeRetryWithEnhancedParams(
          enhancedParams,
          retryCount,
          maxRetries,
          enhanceParamsForRetry,
          isAggregationQuery,
          financialQueryType,
          queryText,
          analyzeResponseCompleteness
        );
        
        // If retry was successful and returned a valid response, update apiResponse and completenessCheck
        if (retryResult.retryAttempted && retryResult.apiResponse) {
          apiResponse = retryResult.apiResponse;
          completenessCheck = retryResult.completenessCheck;
          
          // If complete, break out of retry loop immediately to save time
          if (completenessCheck.isComplete) {
            console.log('Received complete response, breaking retry loop');
            break;
          }
        }
        
        retryCount++;
      }
      
      // Process the API response and update the UI
      return processApiResponse(
        apiResponse,
        processedMessages,
        regulatoryContext,
        reasoning,
        financialQueryType,
        completenessCheck
      );
      
    } catch (error) {
      const errorMessage = handleApiError(error, processedMessages);
      setMessages([...processedMessages, errorMessage]);
      return errorMessage;
    }
  };

  return {
    handleApiResponse
  };
};
