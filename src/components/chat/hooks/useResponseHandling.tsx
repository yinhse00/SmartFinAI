
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
      
      // CRITICAL FIX: Add timing logs for debugging
      const apiCallStartTime = Date.now();
      console.log('API call started at:', new Date(apiCallStartTime).toISOString());
      
      // Determine if this is a simple conversational query
      const isSimpleQuery = isQuerySimple(queryText);
      
      // Determine if this is an aggregation query for special handling
      const isAggregationQuery = isQueryAggregationRelated(queryText);
      
      // Apply token limits and enhancements - use more conservative limits
      const enhancedParams = {
        ...responseParams,
        temperature: Math.min(0.3, responseParams.temperature || 0.3), // Lower temperature
        maxTokens: Math.min(2800, responseParams.maxTokens || 2800)    // Conservative token limit
      };
      
      console.log(`Using request parameters: tokens=${enhancedParams.maxTokens}, temperature=${enhancedParams.temperature}`);
      
      // CRITICAL FIX: Add environment-specific logging
      const isProduction = !window.location.href.includes('localhost') && 
                         !window.location.href.includes('127.0.0.1');
      console.log("Current environment:", isProduction ? "production" : "development");
      console.log("Current URL:", window.location.href);
      
      // Make the initial API call
      let apiResponse: GrokResponse;
      try {
        apiResponse = await grokService.generateResponse(enhancedParams);
        const apiCallDuration = Date.now() - apiCallStartTime;
        console.log(`API call completed in ${apiCallDuration}ms`);
      } catch (error) {
        console.error("Initial API call failed:", error);
        const errorMessage = handleApiError(error, processedMessages);
        setMessages([...processedMessages, errorMessage]);
        return errorMessage;
      }
      
      // Check if it's using fallback
      const isUsingFallback = isFallbackResponse(apiResponse.text);
      
      // CRITICAL FIX: Better debug logging for fallback detection
      console.log("Fallback detection result:", {
        isUsingFallback,
        responseLength: apiResponse.text.length,
        firstChars: apiResponse.text.substring(0, 30),
        lastChars: apiResponse.text.substring(apiResponse.text.length - 30)
      });
      
      if (isUsingFallback && isGrokApiKeySet) {
        console.log("Fallback response detected despite valid API key");
        handleFallbackResponse(isGrokApiKeySet);
      }
      
      // Analyze responseText completeness
      let completenessCheck = analyzeResponseCompleteness(
        apiResponse.text, 
        financialQueryType, 
        queryText, 
        isSimpleQuery
      );
      
      // Log the completeness check results
      console.log(`Response completeness check - Complete: ${completenessCheck.isComplete}, Reasons: ${completenessCheck.reasons.join(', ')}`);
      
      // CRITICAL FIX: Always show the partial response even if it seems incomplete
      // This ensures consistent behavior between environments
      if (!completenessCheck.isComplete) {
        console.log("Response appears incomplete, marking as truncated but showing partial response");
        
        // Mark response as truncated so UI can show retry option
        apiResponse.metadata = {
          ...apiResponse.metadata,
          responseCompleteness: {
            isComplete: false,
            confidence: completenessCheck.financialAnalysis?.confidence || 'medium',
            reasons: completenessCheck.reasons
          }
        };
        
        // Show toast but ALWAYS display the partial response
        toast({
          title: "Partial Response",
          description: "The response appears incomplete. You can retry for a more complete answer.",
          duration: 8000,
        });
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
      console.error("Unhandled error in response handling:", error);
      const errorMessage = handleApiError(error, processedMessages);
      setMessages([...processedMessages, errorMessage]);
      return errorMessage;
    }
  };

  return {
    handleApiResponse
  };
};
