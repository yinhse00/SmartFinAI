
import { useToast } from '@/hooks/use-toast';
import { grokService } from '@/services/grokService';
import { Message } from '../ChatMessage';
import { useErrorHandling } from './useErrorHandling';
import { useResponseAnalysis } from './useResponseAnalysis';
import { useFallbackDetection } from './useFallbackDetection';
import { GrokResponse } from '@/types/grok';
import { useTokenManagement } from './useTokenManagement';
import { useResponseProcessor } from './useResponseProcessor';

// Add batchInfo param
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

  // batchInfo: { batchNumber, isContinuing, onContinue }
  const handleApiResponse = async (
    queryText: string,
    responseParams: any,
    regulatoryContext: string | undefined,
    reasoning: string | undefined,
    financialQueryType: string,
    processedMessages: Message[],
    batchInfo?: { batchNumber: number, isContinuing: boolean, onContinue?: () => void }
  ) => {
    try {
      console.log('Calling API for SmartFinAI response');
      const apiCallStartTime = Date.now();

      const isSimpleQuery = isQuerySimple(queryText);
      const isAggregationQuery = queryText.toLowerCase().includes('aggregate') ||
        queryText.toLowerCase().includes('rule 7.19a');

      let enhancedParams = enhanceTokenLimits(
        queryText,
        responseParams,
        isSimpleQuery,
        isAggregationQuery
      );

      // For batch continuations, add specific instructions to continue from previous part
      if (batchInfo && batchInfo.isContinuing && batchInfo.batchNumber > 1) {
        const batchPromptAddition = `\n\nIMPORTANT: This is a continuation (Part ${batchInfo.batchNumber}). Continue directly from where the previous response ended WITHOUT repeating information. If there was a list, table, or explanation that was cut off, CONTINUE it directly. DO NOT summarize or restate what was covered in previous parts. DO NOT include introductory phrases like "Continuing from the previous part".`;
        
        enhancedParams.prompt = (enhancedParams.prompt || queryText) + batchPromptAddition;
        
        // For batch continuation, reduce typical intro text in system message
        if (enhancedParams.systemMessage) {
          enhancedParams.systemMessage += "\n\nCRITICAL INSTRUCTION: This is a continuation request. Continue directly where the previous response was cut off. Do not repeat information, do not summarize previous content, and do not include phrases like 'As I was saying' or 'To continue'. Just pick up exactly where the previous response ended.";
        }
      } else if (!batchInfo && enhancedParams.prompt) {
        // For initial responses that might need batching, add instruction to be concise
        enhancedParams.prompt += " IMPORTANT: Provide a concise but COMPLETE response. Prioritize including all key information rather than details. If the response needs to be split into multiple parts, focus on the most important information in this first part.";
      }

      const isProduction = !window.location.href.includes('localhost') &&
        !window.location.href.includes('127.0.0.1');
      console.log("Current environment:", isProduction ? "production" : "development");

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

      const completenessCheck = analyzeResponseCompleteness(
        apiResponse.text,
        financialQueryType,
        queryText,
        isSimpleQuery
      );

      console.log(`Response completeness check - Complete: ${completenessCheck.isComplete}`);

      // Add batch part to our extended API response
      const apiResponseWithBatch = {
        ...apiResponse,
        // Add this property for internal use only - won't be part of the GrokResponse type
        batchPart: batchInfo?.batchNumber
      };

      if (!completenessCheck.isComplete) {
        console.log("Response appears incomplete, marking as truncated");

        apiResponseWithBatch.metadata = {
          ...apiResponseWithBatch.metadata,
          responseCompleteness: {
            isComplete: false,
            confidence: completenessCheck.financialAnalysis?.confidence || 'medium',
            reasons: completenessCheck.reasons
          }
        };

        // Only add this note if it's not a batch continuation
        if (!batchInfo || batchInfo.batchNumber <= 1) {
          apiResponseWithBatch.text += "\n\n[NOTE: This response may be incomplete. You can try the 'Continue' button for the next part.]";
        }

        // Proactively handle batch continuation
        if (batchInfo && batchInfo.onContinue) {
          toast({
            title: `Part ${batchInfo.batchNumber} delivered`,
            description: "The answer is not yet complete. Click 'Continue' for the next part of the response.",
            duration: 8000,
          });
        }
      }

      return processApiResponse(
        apiResponseWithBatch,
        processedMessages,
        regulatoryContext,
        reasoning,
        financialQueryType,
        completenessCheck,
        batchInfo
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
