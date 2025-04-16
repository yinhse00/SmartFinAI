
import { useToast } from '@/hooks/use-toast';
import { GrokResponse } from '@/types/grok';
import { Message } from '../ChatMessage';
import { useResponseFormatter } from './useResponseFormatter';
import { useFallbackDetection } from './useFallbackDetection';

/**
 * Hook for processing API responses and formatting messages
 */
export const useResponseProcessor = (
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>,
  retryLastQuery: () => void
) => {
  const { toast } = useToast();
  const { formatBotMessage, showTruncationToast } = useResponseFormatter();
  const { isFallbackResponse } = useFallbackDetection();

  const processApiResponse = (
    apiResponse: GrokResponse,
    processedMessages: Message[],
    regulatoryContext: string | undefined,
    reasoning: string | undefined,
    financialQueryType: string,
    completenessCheck: any
  ): Message => {
    // Check if it's using fallback
    const isUsingFallback = isFallbackResponse(apiResponse.text);
    
    // Format the bot message
    const botMessage = formatBotMessage(
      { ...apiResponse, queryType: financialQueryType }, 
      regulatoryContext, 
      reasoning, 
      isUsingFallback
    );
    
    // Only mark as truncated for non-simple queries that failed completeness check
    if (!completenessCheck.isComplete) {
      console.log('Incomplete response detected after all retries:', {
        reasons: completenessCheck.reasons,
        financialAnalysisMissingElements: completenessCheck.financialAnalysis.missingElements
      });
      
      botMessage.isTruncated = true;
    }
    
    setMessages([...processedMessages, botMessage]);
    console.log('Response delivered successfully');
    
    if (botMessage.isTruncated) {
      console.log('Response appears to be truncated, showing retry option');
      const diagnostics = completenessCheck.reasons.length > 0 
        ? { reasons: completenessCheck.reasons } 
        : { reasons: ['Response appears incomplete'] };
        
      showTruncationToast(diagnostics, completenessCheck.financialAnalysis, retryLastQuery);
    }
    
    return botMessage;
  };

  return {
    processApiResponse
  };
};
