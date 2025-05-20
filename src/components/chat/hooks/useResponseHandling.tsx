import { useToast } from '@/hooks/use-toast';
import { Message } from '../ChatMessage';
import { GrokResponse } from '@/types/grok';
import { useResponseProcessor } from './useResponseProcessor';

// Update interface to include isSeamlessBatch property
interface BatchInfo {
  batchNumber: number;
  isContinuing: boolean;
  onContinue?: () => void;
  isSeamlessBatch?: boolean;  // Added this property to fix the type error
}

/**
 * Hook for handling API responses
 */
export const useResponseHandling = (
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>,
  retryLastQuery: () => void,
  isGrokApiKeySet: boolean
) => {
  const { toast } = useToast();
  const { processApiResponse } = useResponseProcessor(setMessages, retryLastQuery);

  const handleApiResponse = async (
    queryText: string,
    responseParams: any,
    regulatoryContext: string | undefined,
    reasoning: string | undefined,
    financialQueryType: string,
    updatedMessages: Message[],
    batchInfo?: BatchInfo
  ) => {
    let result: any = {};
    try {
      result = await new Promise(async (resolve, reject) => {
        if (!isGrokApiKeySet) {
          toast({
            title: "Error",
            description: "GROK_API_KEY is not set. Please set it in the settings.",
            variant: "destructive"
          });
          reject(new Error("GROK_API_KEY is not set"));
          return;
        }

        if (!responseParams) {
          toast({
            title: "Error",
            description: "responseParams are undefined.",
            variant: "destructive"
          });
          reject(new Error("responseParams are undefined"));
          return;
        }

        try {
          const apiResponse = await fetch('/api/grok', responseParams);

          if (!apiResponse.ok) {
            console.error('Full API response:', apiResponse);
            reject(new Error(`HTTP error! status: ${apiResponse.status}`));
            return;
          }

          const data = await apiResponse.json() as GrokResponse;

          if (!data || !data.text) {
            console.error('Invalid data format:', data);
            reject(new Error('Invalid data format from API'));
            return;
          }

          // Simulate a completeness check (replace with actual logic)
          const completenessCheck = {
            isComplete: !data.text.includes("I couldn't find")
          };

          const botMessage = processApiResponse(
            data,
            updatedMessages,
            regulatoryContext,
            reasoning,
            financialQueryType,
            completenessCheck,
            {
              batchNumber: batchInfo?.batchNumber || 1,
              isContinuing: batchInfo?.isContinuing || false,
              onContinue: batchInfo?.onContinue,
              isSeamlessBatch: batchInfo?.isSeamlessBatch
            }
          );

          resolve({
            ...data,
            isTruncated: botMessage.isTruncated
          });

        } catch (apiError) {
          console.error("Error fetching data from Grok API:", apiError);
          reject(apiError);
        }
      });
    } catch (error) {
      console.error("Error in handleApiResponse:", error);
      toast({
        title: "Error",
        description: "Failed to get a response from the server.",
        variant: "destructive"
      });
      throw error;
    }
    
    return result;
  };

  return {
    handleApiResponse,
  };
};
