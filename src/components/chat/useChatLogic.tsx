import { useMessageState } from './hooks/useMessageState';
import { useApiKeyState } from './hooks/useApiKeyState';
import { useInputState } from './hooks/useInputState';
import { useBatchHandling } from './hooks/useBatchHandling';
import { useLanguageState } from './hooks/useLanguageState';
import { useOptimizedWorkflowProcessor } from './hooks/useOptimizedWorkflowProcessor';

/**
 * Enhanced main hook that orchestrates chat functionality with optimized workflow
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

  // Enhanced optimized workflow processor with improved state management
  const {
    isLoading,
    processingStage,
    currentStep,
    executeOptimizedWorkflow
  } = useOptimizedWorkflowProcessor({
    messages,
    setMessages,
    setLastQuery,
    setApiKeyDialogOpen
  });

  // Handle sending messages with enhanced processing
  const handleSend = () => {
    checkIsChineseInput(input);
    executeOptimizedWorkflow(input);
    setInput('');
  };
  
  // Handle keyboard input
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSend();
    }
  };
  
  // Handle batch continuation with optimized workflow
  const handleContinueBatch = async () => {
    await continueBatch(async (query) => {
      checkIsChineseInput(query);
      await executeOptimizedWorkflow(query);
    });
  };
  
  // Handle retrying queries with optimization
  const retryLastQuery = () => {
    if (lastQuery) {
      executeOptimizedWorkflow(`${lastQuery} [RETRY_ATTEMPT]`);
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

    // Enhanced query processing with optimization
    isLoading,
    handleSend,
    handleKeyDown,
    processQuery: executeOptimizedWorkflow,  // Unified optimized processor
    retryLastQuery,
    currentStep,
    stepProgress: processingStage, // Use the enhanced processing stage

    // Batch handling
    isBatching,
    currentBatchNumber,
    handleContinueBatch,
    autoBatch,
    
    // Language detection
    lastInputWasChinese
  };
};
