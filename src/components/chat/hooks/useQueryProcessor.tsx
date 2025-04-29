
import { useState } from 'react';
import { useRetryHandler } from './useRetryHandler';
import { useQueryExecution } from './useQueryExecution';
import { Message } from '../ChatMessage';

export const useQueryProcessor = (
  messages: Message[],
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>,
  setLastQuery: React.Dispatch<React.SetStateAction<string>>,
  setInput: React.Dispatch<React.SetStateAction<string>>,
  lastQuery: string,
  isGrokApiKeySet: boolean,
  setApiKeyDialogOpen: React.Dispatch<React.SetStateAction<boolean>>
) => {
  const [isLoading, setIsLoading] = useState(false);
  const [processingStage, setProcessingStage] = useState<'preparing' | 'processing' | 'finalizing' | 'reviewing'>('preparing');
  
  const { retryLastQuery, setProcessQueryFn } = useRetryHandler(lastQuery, setInput);
  
  const { executeQuery } = useQueryExecution(
    messages,
    setMessages,
    setLastQuery,
    setInput,
    retryLastQuery,
    isGrokApiKeySet,
    setApiKeyDialogOpen,
    setIsLoading,
    setProcessingStage
  );
  
  // Create our main query processing function
  const processQuery = async (
    queryText: string,
    batchInfo?: { batchNumber: number, isContinuing: boolean },
    onBatchTruncated?: (isTruncated: boolean) => void
  ) => {
    // Set loading state
    setIsLoading(true);
    
    try {
      await executeQuery(queryText, batchInfo, onBatchTruncated);
    } catch (error) {
      console.error("Error in query processor:", error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Register the process function with the retry handler
  setProcessQueryFn(processQuery);
  
  return {
    isLoading,
    processingStage,
    processQuery
  };
};
