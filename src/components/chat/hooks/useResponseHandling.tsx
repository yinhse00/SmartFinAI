
import { useToast } from '@/hooks/use-toast';
import { grokService } from '@/services/grokService';
import { Message } from '../ChatMessage';
import { useErrorHandling } from './useErrorHandling';
import { useResponseAnalysis } from './useResponseAnalysis';
import { useFallbackDetection } from './useFallbackDetection';
import { GrokResponse } from '@/types/grok';
import { useTokenManagement } from './useTokenManagement';
import { useResponseProcessor } from './useResponseProcessor';
import { translationService } from '@/services/translation/translationService';

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
    processedMessages: Message[],
    batchInfo?: { batchNumber: number, isContinuing: boolean },
    needsChineseTranslation: boolean = false
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

      if (enhancedParams.prompt) {
        enhancedParams.prompt += " IMPORTANT: Provide a concise but COMPLETE response. Prioritize including all key information rather than details.";
      }

      const isProduction = !window.location.href.includes('localhost') &&
        !window.location.href.includes('127.0.0.1');
      console.log("Current environment:", isProduction ? "production" : "development");

      let apiResponse: GrokResponse;
      try {
        apiResponse = await grokService.generateResponse(enhancedParams);
        const apiCallDuration = Date.now() - apiCallStartTime;
        console.log(`API call completed in ${apiCallDuration}ms`);

        if (needsChineseTranslation && apiResponse.text) {
          console.log('Translating response to Chinese');
          try {
            const translatedResponse = await translationService.translateContent({
              content: apiResponse.text,
              sourceLanguage: 'en',
              targetLanguage: 'zh'
            });
            apiResponse.text = translatedResponse.text;
            console.log('Response successfully translated to Chinese');
          } catch (error) {
            console.error('Translation error:', error);
            toast({
              title: "Translation Notice",
              description: "Could not translate the response to Chinese. Showing English response instead.",
              duration: 5000,
            });
          }
        }

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

        apiResponse.text += "\n\n[NOTE: This response may be incomplete. You can try the 'Continue' button for the next part.]";

        toast({
          title: "Partial Response",
          description: "The complete answer was not generated. Click 'Continue' for a more complete response.",
          duration: 8000,
        });
      }

      return processApiResponse(
        apiResponse,
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
