
import { useMessageState } from './hooks/useMessageState';
import { useApiKeyState } from './hooks/useApiKeyState';
import { useInputState } from './hooks/useInputState';
import { useQueryProcessor } from './hooks/useQueryProcessor';
import { useReferenceDocuments } from '@/hooks/useReferenceDocuments';
import { useBatchHandling } from './hooks/useBatchHandling';
import { useLanguageState } from './hooks/useLanguageState';

/**
 * Main hook that orchestrates chat functionality by composing smaller, focused hooks
 */
export const useChatLogic = () => {
  // Message state management
  const {
    messages,
    setMessages,
    clearConversationMemory
  } = useMessageState();
  
  // API key management
  const {
    grokApiKeyInput,
    setGrokApiKeyInput,
    isGrokApiKeySet,
    apiKeyDialogOpen,
    setApiKeyDialogOpen,
    handleSaveApiKeys
  } = useApiKeyState();
  
  // Input state management
  const { input, setInput, lastQuery, setLastQuery } = useInputState();
  
  // Reference documents
  const { data: referenceDocuments = [] } = useReferenceDocuments();
  
  // Language state management
  const { lastInputWasChinese, checkIsChineseInput } = useLanguageState();
  
  // Batch handling
  const {
    isBatching,
    currentBatchNumber,
    autoBatch,
    handleBatchContinuation: continueBatch,
    handleBatchResult,
    startBatching
  } = useBatchHandling();

  // Query processing
  const {
    isLoading,
    processingStage,
    processQuery: executeQuery
  } = useQueryProcessor(
    messages,
    setMessages,
    setLastQuery,
    setInput,
    lastQuery,
    isGrokApiKeySet,
    setApiKeyDialogOpen
  );

  // Compose the processor with batch handling
  const processQuery = async (queryText: string, options: { isBatchContinuation?: boolean, autoBatch?: boolean } = {}) => {
    // Check language
    checkIsChineseInput(queryText);
    
    // Handle batching setup
    const isBatchContinuation = options.isBatchContinuation || false;
    const autoBatchMode = options.autoBatch ?? autoBatch;
    
    let prompt = queryText;
    
    if (isBatchContinuation && currentBatchNumber > 1) {
      prompt = `${queryText} [CONTINUE_BATCH_PART ${currentBatchNumber}] Please continue the previous answer immediately after the last word, avoiding unnecessary repetition or summary.`;
    }
    
    // Initialize batch state
    if (!isBatchContinuation) {
      startBatching(queryText, autoBatchMode);
    }
    
    const batchInfo = isBatchContinuation
      ? { batchNumber: currentBatchNumber, isContinuing: true }
      : undefined;
      
    await executeQuery(
      prompt,
      batchInfo,
      (truncated: boolean) => {
        const result = handleBatchResult(truncated, queryText, autoBatchMode);
        if (result.shouldContinue) {
          processQuery(queryText, { isBatchContinuation: true, autoBatch: autoBatchMode });
        }
      }
    );
  };
  
  // Handle sending messages
  const handleSend = () => {
    processQuery(input);
  };
  
  // Handle keyboard input
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSend();
    }
  };
  
  // Handle batch continuation
  const handleContinueBatch = () => {
    continueBatch((query, options) => processQuery(query, options));
  };
  
  // Handle retrying queries
  const retryLastQuery = () => {
    if (lastQuery) {
      processQuery(`${lastQuery} [RETRY_ATTEMPT]`);
    }
  };

  return {
    // Message state
    messages,
    setMessages,
    clearConversationMemory,

    // API key state
    grokApiKeyInput,
    setGrokApiKeyInput,
    isGrokApiKeySet,
    apiKeyDialogOpen,
    setApiKeyDialogOpen,
    handleSaveApiKeys,

    // Input state
    input,
    setInput,
    lastQuery,

    // Query processing
    isLoading,
    handleSend,
    handleKeyDown,
    processQuery,
    retryLastQuery,
    processingStage,

    // Batch handling
    isBatching,
    currentBatchNumber,
    handleContinueBatch,
    autoBatch,
    
    // Language detection
    lastInputWasChinese
  };
};
