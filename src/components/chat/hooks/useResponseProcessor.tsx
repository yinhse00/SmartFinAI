import { useToast } from '@/hooks/use-toast';
import { GrokResponse } from '@/types/grok';
import { Message } from '../ChatMessage';
import { useResponseFormatter } from './useResponseFormatter';
import { useFallbackDetection } from './useFallbackDetection';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';

export const useResponseProcessor = (
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>,
  retryLastQuery: () => void
) => {
  const { toast } = useToast();
  const { formatBotMessage, showTruncationToast } = useResponseFormatter();
  const { isFallbackResponse } = useFallbackDetection();

  const processApiResponse = (
    apiResponse: GrokResponse & { batchPart?: number },
    processedMessages: Message[],
    regulatoryContext: string | undefined,
    reasoning: string | undefined,
    financialQueryType: string,
    completenessCheck: any,
    batchInfo?: { 
      batchNumber: number, 
      isContinuing: boolean, 
      onContinue?: () => void,
      isSeamlessBatch?: boolean  // New flag for seamless batching
    }
  ): Message => {
    const isUsingFallback = isFallbackResponse(apiResponse.text);

    // Format the bot message
    const botMessage = formatBotMessage(
      { ...apiResponse, queryType: financialQueryType },
      regulatoryContext,
      reasoning,
      isUsingFallback
    ) as Message;

    // Handle batch continuations more intelligently
    if (batchInfo && batchInfo.batchNumber > 1) {
      if (batchInfo.isSeamlessBatch) {
        // For seamless batching, don't add part numbers to the content
        // Just keep the content as is, but mark it as a batch part
        botMessage.isBatchPart = true;
        
        // For seamless batching, find the previous bot message and append this content
        const updatedMessages = [...processedMessages];
        let lastBotMessageIndex = updatedMessages.length - 1;
        
        // Find the last bot message (might not be the last message if there are user messages)
        while (lastBotMessageIndex >= 0 && updatedMessages[lastBotMessageIndex].sender !== 'bot') {
          lastBotMessageIndex--;
        }
        
        if (lastBotMessageIndex >= 0) {
          // Instead of creating a new message, append to the existing one
          const existingBotMessage = updatedMessages[lastBotMessageIndex];
          
          // Only append if it's a bot message and not an error message
          if (existingBotMessage && !existingBotMessage.isError) {
            // Combine the content
            updatedMessages[lastBotMessageIndex] = {
              ...existingBotMessage,
              content: existingBotMessage.content + botMessage.content,
              isBatchPart: true,
              isTruncated: completenessCheck && !completenessCheck.isComplete
            };
            
            setMessages(updatedMessages);
            console.log('Seamlessly appended batch content to previous message');
            
            // Return the updated message for reference
            return updatedMessages[lastBotMessageIndex];
          }
        }
      } else {
        // Traditional batch handling with part numbers
        botMessage.content = `[Part ${batchInfo.batchNumber}]\n\n${botMessage.content}`;
        botMessage.isBatchPart = true;
      }
    }

    // Only mark as truncated for non-simple queries that failed completeness check
    if (completenessCheck && !completenessCheck.isComplete) {
      console.log('Incomplete response detected after all retries:', {
        reasons: completenessCheck.reasons || [],
        financialAnalysisMissingElements: completenessCheck.financialAnalysis?.missingElements || []
      });
      botMessage.isTruncated = true;
    }

    // Only add a new message for non-seamless batches or first parts
    if (!(batchInfo?.isSeamlessBatch) || !batchInfo || batchInfo.batchNumber === 1) {
      setMessages([...processedMessages, botMessage]);
      console.log('Response delivered successfully');
    }

    // Show continue button if batch continuation needed and not using seamless batching
    if (botMessage.isTruncated && batchInfo && batchInfo.onContinue && !batchInfo.isSeamlessBatch) {
      const diagnosticsReasons = completenessCheck?.reasons || [];
      const diagnosticMessage = diagnosticsReasons.length > 0
        ? { reasons: diagnosticsReasons }
        : { reasons: ['Response appears incomplete'] };

      toast({
        title: `Additional information available`,
        description: "The answer continues. Click 'Continue' to see more.",
        duration: 10000,
        action: (
          <button
            className="ml-1 px-2 py-1 rounded bg-finance-light-blue text-finance-dark-blue hover:bg-finance-medium-blue"
            onClick={batchInfo.onContinue}
          >Continue</button>
        )
      });
    } else if (botMessage.isTruncated && completenessCheck && !batchInfo?.isSeamlessBatch) {
      // Only call showTruncationToast if completenessCheck has valid data
      if (completenessCheck.reasons || completenessCheck.financialAnalysis) {
        showTruncationToast(
          completenessCheck.reasons ? { reasons: completenessCheck.reasons } : { reasons: [] },
          completenessCheck.financialAnalysis || { missingElements: [] },
          retryLastQuery
        );
      } else {
        // Fallback if completeness check doesn't have the expected structure
        toast({
          title: "Incomplete Response",
          description: "The response appears to be incomplete. You can retry your query for a complete answer.",
          duration: 10000,
          action: (
            <Button
              onClick={retryLastQuery}
              variant="outline"
              size="sm"
              className="flex items-center gap-1"
            >
              <RefreshCw size={14} />
              Retry query
            </Button>
          )
        });
      }
    }

    return botMessage;
  };

  return {
    processApiResponse
  };
};
