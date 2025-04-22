
import { useMessageState } from './hooks/useMessageState';
import { useApiKeyState } from './hooks/useApiKeyState';
import { useInputState } from './hooks/useInputState';
import { useQueryProcessor } from './hooks/useQueryProcessor';
import { useReferenceDocuments } from '@/hooks/useReferenceDocuments';

/**
 * Main chat logic hook that combines all specialized hooks
 */
export const useChatLogic = () => {
  // Use specialized hooks
  const { messages, setMessages } = useMessageState();
  const { 
    grokApiKeyInput, 
    setGrokApiKeyInput, 
    isGrokApiKeySet, 
    apiKeyDialogOpen, 
    setApiKeyDialogOpen,
    handleSaveApiKeys 
  } = useApiKeyState();
  const { input, setInput, lastQuery, setLastQuery } = useInputState();
  
  // Reference documents data - use with enabled: false to avoid auto-fetching
  const { data: referenceDocuments = [] } = useReferenceDocuments();
  
  // Query processor
  const {
    isLoading,
    handleSend,
    handleKeyDown,
    processQuery,
    retryLastQuery,
    processingStage
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
    // Message state
    messages,
    setMessages,
    
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
    
    // Loading state and handlers
    isLoading,
    handleSend,
    handleKeyDown,
    retryLastQuery,
    processingStage
  };
};
