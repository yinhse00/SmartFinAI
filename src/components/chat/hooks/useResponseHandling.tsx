
import { useToast } from '@/hooks/use-toast';
import { grokService } from '@/services/grokService';
import { Message } from '../ChatMessage';
import { useErrorHandling } from './useErrorHandling';
import { useResponseAnalysis } from './useResponseAnalysis';
import { useFallbackDetection } from './useFallbackDetection';
import { GrokResponse } from '@/types/grok';
import { useTokenManagement } from './useTokenManagement';
import { useResponseProcessor } from './useResponseProcessor';

/**
 * Hook for handling API responses with consistent behavior across environments
 */
export const useResponseHandling = (
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>,
  retryLastQuery: () => void,
  isGrokApiKeySet: boolean
) => {
  const { toast } = useToast();
  const { handleApiError, handleFallbackResponse } = useErrorHandling();
  const { analyzeResponseCompleteness, isQuerySimple } = useResponseAnalysis();
  const { isFallbackResponse } = useFallbackDetection();
  const { enhanceTokenLimits } = useTokenManagement();
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
      console.log('Calling API for SmartFinAI response');
      
      // Add timing logs
      const apiCallStartTime = Date.now();
      console.log('API call started at:', new Date(apiCallStartTime).toISOString());
      
      // Determine if this is a simple query
      const isSimpleQuery = isQuerySimple(queryText);
      const isAggregationQuery = queryText.toLowerCase().includes('aggregate') || 
                                 queryText.toLowerCase().includes('rule 7.19a');
      
      // Use the enhanced token limits
      let enhancedParams = enhanceTokenLimits(
        queryText, 
        responseParams, 
        isSimpleQuery,
        isAggregationQuery
      );
      
      console.log(`Using parameters: tokens=${enhancedParams.maxTokens}, temp=${enhancedParams.temperature}`);
      
      // Add instructions to prioritize completeness
      if (enhancedParams.prompt) {
        enhancedParams.prompt += " IMPORTANT: Provide a concise but COMPLETE response. Prioritize including all key information rather than details.";
      }
      
      // Log environment info
      const isProduction = !window.location.href.includes('localhost') && 
                         !window.location.href.includes('127.0.0.1');
      console.log("Current environment:", isProduction ? "production" : "development");
      
      // Make the API call
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
      
      // Use consistent fallback detection
      const isUsingFallback = isFallbackResponse(apiResponse.text);
      
      if (isUsingFallback) {
        console.log("Fallback response detected");
        handleFallbackResponse(isGrokApiKeySet);
        
        if (apiResponse.metadata) {
          apiResponse.metadata.isBackupResponse = true;
        } else {
          apiResponse.metadata = { isBackupResponse: true };
        }
      }
      
      // Check completeness with improved analysis
      const completenessCheck = analyzeResponseCompleteness(
        apiResponse.text, 
        financialQueryType, 
        queryText, 
        isSimpleQuery
      );
      
      console.log(`Response completeness check - Complete: ${completenessCheck.isComplete}`);
      
      // If response is incomplete, mark as truncated
      if (!completenessCheck.isComplete) {
        console.log("Response appears incomplete, marking as truncated");
        
        apiResponse.metadata = {
          ...apiResponse.metadata,
          responseCompleteness: {
            isComplete: false,
            confidence: completenessCheck.financialAnalysis?.confidence || 'medium',
            reasons: completenessCheck.reasons
          }
        };
        
        apiResponse.text += "\n\n[NOTE: This response may be incomplete. You can try the 'Retry with higher limits' button for a more complete answer.]";
        
        toast({
          title: "Partial Response",
          description: "The complete answer was not generated. Click 'Retry' for a more complete response.",
          duration: 8000,
        });
      }
      
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
