
import { useState, useEffect, useCallback } from 'react';
import { Message } from './ChatMessage';
import { useGrokConnection } from '@/hooks/useGrokConnection';
import { useWorkflowProcessor } from './hooks/useWorkflowProcessor';
import useLocalStorage from '@/hooks/useLocalStorage';
import { getGrokApiKey } from '@/services/apiKeyService';

export const useChatLogic = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [lastQuery, setLastQuery] = useState('');
  const [batchState, setBatchState] = useState({ isBatching: false, currentBatchNumber: 1 });
  
  // API Key management
  const [grokApiKeyInput, setGrokApiKeyInput] = useState('');
  const [isGrokApiKeySet, setIsGrokApiKeySet] = useState(false);
  const [apiKeyDialogOpen, setApiKeyDialogOpen] = useState(false);
  
  // Memory management
  const [localStorageMessages, setLocalStorageMessages] = useLocalStorage<Message[]>('chatMessages', []);
  
  // Custom hooks
  const { isConnected, testConnection } = useGrokConnection();
  
  // Use enhanced workflow processor
  const { 
    isLoading, 
    currentStep, 
    stepProgress, 
    executeWorkflow,
    streamingMessageId // Include streaming message ID from workflow processor
  } = useWorkflowProcessor({
    messages,
    setMessages,
    setLastQuery,
    isGrokApiKeySet,
    setApiKeyDialogOpen
  });
  
  // Load messages from localStorage on initial load
  useEffect(() => {
    if (localStorageMessages.length > 0) {
      console.log('Loading messages from localStorage:', localStorageMessages.length);
      setMessages(localStorageMessages);
    }
  }, [localStorageMessages]);
  
  // Save messages to localStorage when they change
  useEffect(() => {
    if (messages.length > 0) {
      setLocalStorageMessages(messages);
    }
  }, [messages, setLocalStorageMessages]);

  // Check API key on load
  useEffect(() => {
    const apiKey = getGrokApiKey();
    const isValidKey = apiKey && apiKey.startsWith('xai-') && apiKey.length > 30;
    
    setIsGrokApiKeySet(isValidKey);
    
    if (isValidKey) {
      testConnection();
    } else {
      console.log('No valid API key found');
    }
  }, [testConnection]);

  // Handle saving API keys
  const handleSaveApiKeys = useCallback((apiKey: string) => {
    localStorage.setItem('grokApiKey', apiKey);
    const isValidKey = apiKey && apiKey.startsWith('xai-') && apiKey.length > 30;
    setIsGrokApiKeySet(isValidKey);
    
    if (isValidKey) {
      testConnection();
    }
    
    return isValidKey;
  }, [testConnection]);

  // Process queries (could come from search, input or batch continuation)
  const processQuery = useCallback((query: string) => {
    executeWorkflow(query);
  }, [executeWorkflow]);

  // Handle send button click
  const handleSend = useCallback(() => {
    if (!input.trim()) return;
    
    processQuery(input);
    setInput('');
  }, [input, processQuery]);

  // Handle Enter key press
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }, [handleSend]);

  // Handle retry of last query
  const retryLastQuery = useCallback(() => {
    if (!lastQuery) return;
    
    const retryQuery = `[RETRY_ATTEMPT] ${lastQuery}`;
    processQuery(retryQuery);
  }, [lastQuery, processQuery]);

  // Handle batch continuation
  const handleContinueBatch = useCallback(() => {
    if (!lastQuery) return;
    
    const nextBatchNumber = batchState.currentBatchNumber + 1;
    const continuationQuery = `[CONTINUATION_PART_${nextBatchNumber}] ${lastQuery}`;
    
    setBatchState({
      isBatching: true,
      currentBatchNumber: nextBatchNumber
    });
    
    processQuery(continuationQuery);
  }, [lastQuery, batchState, processQuery]);

  // Clear conversation memory
  const clearConversationMemory = useCallback(() => {
    setMessages([]);
    setLocalStorageMessages([]);
  }, [setLocalStorageMessages]);

  return {
    messages,
    setMessages,
    input,
    setInput,
    isLoading,
    lastQuery,
    setLastQuery,
    handleSend,
    handleKeyDown,
    processQuery,
    retryLastQuery,
    grokApiKeyInput,
    setGrokApiKeyInput,
    isGrokApiKeySet,
    apiKeyDialogOpen,
    setApiKeyDialogOpen,
    handleSaveApiKeys,
    clearConversationMemory,
    currentStep,
    stepProgress,
    isBatching: batchState.isBatching,
    currentBatchNumber: batchState.currentBatchNumber,
    handleContinueBatch,
    streamingMessageId // Return streaming message ID
  };
};
