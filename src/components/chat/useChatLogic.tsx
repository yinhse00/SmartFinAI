
import { useMessageState } from './hooks/useMessageState';
import { useApiKeyState } from './hooks/useApiKeyState';
import { useInputState } from './hooks/useInputState';
import { useReferenceDocuments } from '@/hooks/useReferenceDocuments';
import { useBatchHandling } from './hooks/useBatchHandling';
import { useLanguageState } from './hooks/useLanguageState';
import { useWorkflowProcessor } from './hooks/useWorkflowProcessor';
import { useFileAttachments } from '@/hooks/useFileAttachments';

/**
 * Main hook that orchestrates chat functionality with the structured workflow
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

  // File attachment handling
  const {
    attachedFiles,
    handleFileSelect,
    clearAttachedFiles,
    removeAttachedFile,
    hasAttachedFiles
  } = useFileAttachments();

  // Workflow processor implementing the structured steps
  const {
    isLoading,
    currentStep,
    stepProgress,
    executeWorkflow
  } = useWorkflowProcessor({
    messages,
    setMessages,
    setLastQuery,
    isGrokApiKeySet,
    setApiKeyDialogOpen,
    attachedFiles
  });

  // Handle sending messages
  const handleSend = () => {
    checkIsChineseInput(input);
    executeWorkflow(input);
    setInput('');
    // Do not clear attachedFiles here - they'll be processed in the workflow
  };
  
  // Handle keyboard input
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSend();
    }
  };
  
  // Handle batch continuation
  const handleContinueBatch = async () => {
    // Create a Promise-returning function that wraps executeWorkflow
    await continueBatch(async (query) => {
      checkIsChineseInput(query);
      await executeWorkflow(query);
    });
  };
  
  // Handle retrying queries
  const retryLastQuery = () => {
    if (lastQuery) {
      executeWorkflow(`${lastQuery} [RETRY_ATTEMPT]`);
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

    // File attachment state
    attachedFiles,
    handleFileSelect,
    clearAttachedFiles,
    removeAttachedFile,
    hasAttachedFiles,

    // Query processing
    isLoading,
    handleSend,
    handleKeyDown,
    processQuery: executeWorkflow,  // Renamed for backward compatibility
    retryLastQuery,
    currentStep,
    stepProgress,

    // Batch handling
    isBatching,
    currentBatchNumber,
    handleContinueBatch,
    autoBatch,
    
    // Language detection
    lastInputWasChinese
  };
};
