
import { useMessageState } from './hooks/useMessageState';
import { useApiKeyState } from './hooks/useApiKeyState';
import { useInputState } from './hooks/useInputState';
import { useQueryProcessor } from './hooks/useQueryProcessor';
import { useReferenceDocuments } from '@/hooks/useReferenceDocuments';

export const useChatLogic = () => {
  const {
    messages,
    setMessages,
    clearConversationMemory
  } = useMessageState();
  const {
    grokApiKeyInput,
    setGrokApiKeyInput,
    isGrokApiKeySet,
    apiKeyDialogOpen,
    setApiKeyDialogOpen,
    handleSaveApiKeys
  } = useApiKeyState();
  const { input, setInput, lastQuery, setLastQuery } = useInputState();
  const { data: referenceDocuments = [] } = useReferenceDocuments();

  const {
    isLoading,
    handleSend,
    handleKeyDown,
    processQuery,
    retryLastQuery,
    processingStage,
    isBatching,
    currentBatchNumber,
    handleContinueBatch,
    autoBatch
  } = useQueryProcessor(
    messages,
    setMessages,
    input,
    setInput,
    lastQuery,
    setLastQuery,
    isGrokApiKeySet,
    setApiKeyDialogOpen
  );

  return {
    messages,
    setMessages,
    clearConversationMemory,

    grokApiKeyInput,
    setGrokApiKeyInput,
    isGrokApiKeySet,
    apiKeyDialogOpen,
    setApiKeyDialogOpen,
    handleSaveApiKeys,

    input,
    setInput,
    lastQuery,

    isLoading,
    handleSend,
    handleKeyDown,
    processQuery,
    retryLastQuery,
    processingStage,

    // Batch/multi-part response state/controls
    isBatching,
    currentBatchNumber,
    handleContinueBatch,
    autoBatch
  };
};
