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
      
      // FIXED: Apply conservative token limits for consistency across environments
      const enhancedParams = {
        ...responseParams,
        temperature: Math.min(0.3, responseParams.temperature || 0.3),
        maxTokens: Math.min(1500, responseParams.maxTokens || 1500)
      };
      
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
      
      // FIXED: Use consistent fallback detection across environments
      const isUsingFallback = isFallbackResponse(apiResponse.text);
      
      // Better debug logging
      console.log("Fallback detection result:", {
        isUsingFallback,
        responseLength: apiResponse.text.length,
        responseFirstChars: apiResponse.text.substring(0, 50) + '...',
        hasBackupMetadata: apiResponse.metadata && apiResponse.metadata.isBackupResponse
      });
      
      // FIXED: Apply consistent fallback handling
      if (isUsingFallback) {
        console.log("Fallback response detected");
        handleFallbackResponse(isGrokApiKeySet);
        
        // Ensure the response is properly marked as fallback for UI display
        if (apiResponse.metadata) {
          apiResponse.metadata.isBackupResponse = true;
        } else {
          apiResponse.metadata = { isBackupResponse: true };
        }
      }
      
      // Analyze response completeness
      let completenessCheck = analyzeResponseCompleteness(
        apiResponse.text, 
        financialQueryType, 
        queryText, 
        isSimpleQuery
      );
      
      console.log(`Response completeness check - Complete: ${completenessCheck.isComplete}`);
      
      // FIXED: Always show the partial response with proper truncation marking
      if (!completenessCheck.isComplete) {
        console.log("Response appears incomplete, marking as truncated");
        
        // Mark as truncated for UI
        apiResponse.metadata = {
          ...apiResponse.metadata,
          responseCompleteness: {
            isComplete: false,
            confidence: completenessCheck.financialAnalysis?.confidence || 'medium',
            reasons: completenessCheck.reasons
          }
        };
        
        // Show toast but always display the partial response
        toast({
          title: "Partial Response Available",
          description: "The complete answer is not available. Showing partial information.",
          duration: 8000,
        });
      }
      
      // Process and display response
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
