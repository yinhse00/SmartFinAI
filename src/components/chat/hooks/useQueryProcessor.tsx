
import { useEffect, useRef, useState } from 'react';
import { useRetryHandler } from './useRetryHandler';
import { useQueryExecution } from './useQueryExecution';
import { useQueryInputHandler } from './useQueryInputHandler';
import { Message } from '../ChatMessage';

export const useQueryProcessor = (
  messages: Message[],
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>,
  input: string,
  setInput: React.Dispatch<React.SetStateAction<string>>,
  lastQuery: string,
  setLastQuery: React.Dispatch<React.SetStateAction<string>>,
  isGrokApiKeySet: boolean,
  setApiKeyDialogOpen: React.Dispatch<React.SetStateAction<boolean>>
) => {
  const { retryLastQuery, setProcessQueryFn } = useRetryHandler(lastQuery, setInput);
  const { isLoading, processQuery: executeQuery, processingStage } = useQueryExecution(
    messages,
    setMessages,
    setLastQuery,
    setInput,
    retryLastQuery,
    isGrokApiKeySet,
    setApiKeyDialogOpen
  );

  // Batch/multi-part state
  const batchNumber = useRef(1);
  const [isBatching, setIsBatching] = useState(false);
  const [batchingPrompt, setBatchingPrompt] = useState<string | null>(null);

  // Create our actual processQuery function
  const processQuery = async (queryText: string, options: { isBatchContinuation?: boolean } = {}) => {
    // If continuing a batch, add special instruction
    let prompt = queryText;
    const isBatchContinuation = options.isBatchContinuation || false;
    
    if (isBatchContinuation && batchNumber.current > 1) {
      prompt = `${queryText} [CONTINUE_BATCH_PART ${batchNumber.current}] Please continue the previous answer immediately after the last word, avoiding unnecessary repetition or summary.`;
    }

    // Store for UI
    if (!isBatchContinuation) {
      setBatchingPrompt(queryText);
      batchNumber.current = 1;
      setIsBatching(false);
    }

    const batchInfo = isBatchContinuation
      ? { batchNumber: batchNumber.current, isContinuing: true }
      : undefined;

    // Wrap setMessages to append messages
    const setMessagesBatch = (msgs: Message[]) => setMessages(msgs);
    // Call the original processQuery from useQueryExecution
    await executeQuery(
      prompt,
      batchInfo,
      async (truncated: boolean) => {
        // If response was truncated, allow batch continuation
        if (truncated) {
          setIsBatching(true);
        } else {
          setIsBatching(false);
        }
      }
    );
  };

  // Initialize the input handler after processQuery is defined
  const { handleSend, handleKeyDown } = useQueryInputHandler(processQuery, input);

  // Triggered when user clicks "Continue" for the next batch part
  const handleContinueBatch = () => {
    if (batchingPrompt) {
      batchNumber.current += 1;
      processQuery(batchingPrompt, { isBatchContinuation: true });
    }
  };

  useEffect(() => {
    setProcessQueryFn((query: string, opts = {}) => processQuery(query, opts));
  }, [processQuery, setProcessQueryFn]);

  return {
    isLoading,
    handleSend,
    handleKeyDown,
    processQuery,
    retryLastQuery,
    processingStage,
    isBatching,
    currentBatchNumber: batchNumber.current,
    handleContinueBatch
  };
};
