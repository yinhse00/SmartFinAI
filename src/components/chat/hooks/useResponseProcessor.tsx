
import { useToast } from '@/hooks/use-toast';
import { GrokResponse } from '@/types/grok';
import { Message } from '../ChatMessage';
import { useResponseFormatter } from './useResponseFormatter';
import { useFallbackDetection } from './useFallbackDetection';

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
    completenessCheck: any,
    batchInfo?: { batchNumber: number, isContinuing: boolean, onContinue?: () => void }
  ): Message => {
    const isUsingFallback = isFallbackResponse(apiResponse.text);

    // Format the bot message
    const botMessage = formatBotMessage(
      { ...apiResponse, queryType: financialQueryType },
      regulatoryContext,
      reasoning,
      isUsingFallback
    );

    // If in batching mode, mark the message batch part.
    if (batchInfo && batchInfo.batchNumber > 1) {
      botMessage.content = `[Part ${batchInfo.batchNumber}]\n\n${botMessage.content}`;
      botMessage.isBatchPart = true;
    }

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

    // Show continue ("next part") button if batch continuation needed
    if (botMessage.isTruncated && batchInfo && batchInfo.onContinue) {
      const diagnostics = completenessCheck.reasons.length > 0
        ? { reasons: completenessCheck.reasons }
        : { reasons: ['Response appears incomplete'] };

      toast({
        title: `Part ${batchInfo.batchNumber} delivered`,
        description: "The answer is not yet complete. Click 'Continue' for the next part of the response.",
        duration: 16000,
        action: (
          <button
            className="ml-1 px-2 py-1 rounded bg-finance-light-blue text-finance-dark-blue hover:bg-finance-medium-blue"
            onClick={batchInfo.onContinue}
          >Continue</button>
        )
      });
    } else if (botMessage.isTruncated) {
      showTruncationToast(
        completenessCheck.reasons,
        completenessCheck.financialAnalysis,
        retryLastQuery
      );
    }

    return botMessage;
  };

  return {
    processApiResponse
  };
};
