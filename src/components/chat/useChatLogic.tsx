import { useState, useCallback, useRef, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useApiKeyState } from './useApiKeyState';
import { useQueryExecution } from './useQueryExecution';
import { useRetryHandler } from './useRetryHandler';
import { useLanguageDetection } from './useLanguageDetection';
import { useBatchHandling } from './useBatchHandling';
import { Message } from '../ChatMessage';

export const useChatLogic = () => {
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [lastQuery, setLastQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [processingStage, setProcessingStage] = useState<'preparing' | 'processing' | 'finalizing' | 'reviewing'>('preparing');
  
  const { 
    grokApiKeyInput, 
    setGrokApiKeyInput, 
    isGrokApiKeySet, 
    apiKeyDialogOpen, 
    setApiKeyDialogOpen, 
    handleSaveApiKeys 
  } = useApiKeyState();
  
  const { 
    retryLastQuery, 
    setProcessQueryFn, 
    setLastContext,
    lastContext
  } = useRetryHandler(lastQuery, setInput);
  
  const { 
    lastUserMessageIsChinese 
  } = useLanguageDetection(messages, input);
  
  const {
    isBatching,
    currentBatchNumber,
    autoBatch,
    isApiKeyRotating,
    startBatching,
    handleBatchContinuation,
    handleBatchResult,
    setBatchingPrompt,
    batchingPrompt
  } = useBatchHandling();
  
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
  
  // Store the processQuery function in the retry handler
  useEffect(() => {
    setProcessQueryFn(processQuery);
  }, [processQuery, setProcessQueryFn]);
  
  // Clear conversation history
  const clearConversationMemory = useCallback(() => {
    setMessages([]);
    toast({
      title: "Conversation cleared",
      description: "The chat history has been cleared.",
    });
  }, [toast]);
  
  // Generic event handler for sending messages
  const handleSend = useCallback(() => {
    processQuery(input);
  }, [input, processQuery]);
  
  // Handle keydown events for sending messages
  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  };
  
  // Main query processing function
  const processQuery = useCallback(async (
    queryText: string,
    batchInfo?: { batchNumber: number, isContinuing: boolean },
    onBatchTruncated?: (isTruncated: boolean) => void
  ) => {
    setIsLoading(true);
    
    try {
      await executeQuery(queryText, batchInfo, onBatchTruncated);
    } finally {
      setIsLoading(false);
    }
  }, [executeQuery, setIsLoading]);
  
  // Add isApiKeyRotating to the returned object
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
    currentStep: 'initial',
    stepProgress: 'Preparing your request',
    isBatching,
    currentBatchNumber,
    handleContinueBatch: () => handleBatchContinuation(processQuery),
    isApiKeyRotating,
    lastInputWasChinese
  };
};
