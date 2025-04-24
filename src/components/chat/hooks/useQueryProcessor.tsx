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
  const [autoBatch, setAutoBatch] = useState(true);

  // Auto-batch controller (when truncation is detected, keep fetching next parts until complete or max batches reached)
  const MAX_AUTO_BATCHES = 4;

  // Create our actual processQuery function
  const processQuery = async (queryText: string, options: { isBatchContinuation?: boolean, autoBatch?: boolean } = {}) => {
    // If continuing a batch, add special instruction
    let prompt = queryText;
    const isBatchContinuation = options.isBatchContinuation || false;
    const autoBatchMode = options.autoBatch ?? autoBatch;

    if (isBatchContinuation && batchNumber.current > 1) {
      prompt = `${queryText} [CONTINUE_BATCH_PART ${batchNumber.current}] Please continue the previous answer immediately after the last word, avoiding unnecessary repetition or summary.`;
    }

    // Store for UI
    if (!isBatchContinuation) {
      setBatchingPrompt(queryText);
      batchNumber.current = 1;
      setIsBatching(false);
      setAutoBatch(autoBatchMode);
    }

    const batchInfo = isBatchContinuation
      ? { batchNumber: batchNumber.current, isContinuing: true }
      : undefined;

    const setMessagesBatch = (msgs: Message[]) => setMessages(msgs);

    let truncatedLastPart = false;

    await executeQuery(
      prompt,
      batchInfo,
      async (truncated: boolean) => {
        truncatedLastPart = truncated;
        if (truncated && autoBatchMode && batchNumber.current < MAX_AUTO_BATCHES) {
          setIsBatching(true);
          setTimeout(() => {
            batchNumber.current += 1;
            processQuery(queryText, { isBatchContinuation: true, autoBatch: autoBatchMode });
          }, 750);
        } else if (truncated) {
          setIsBatching(true);
        } else {
          setIsBatching(false);
        }
      }
    );
  };

  // Initialize input handler after processQuery is defined
  const { handleSend, handleKeyDown } = useQueryInputHandler(
    (q, opt = {}) => processQuery(q, { ...opt, autoBatch }), input
  );

  // Triggered when user clicks "Continue" for the next batch part
  const handleContinueBatch = () => {
    if (batchingPrompt) {
      batchNumber.current += 1;
      processQuery(batchingPrompt, { isBatchContinuation: true, autoBatch });
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
    handleContinueBatch,
    autoBatch
  };
};
