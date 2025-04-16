
import { useEffect } from 'react';
import { useRetryHandler } from './useRetryHandler';
import { useQueryExecution } from './useQueryExecution';
import { useQueryInputHandler } from './useQueryInputHandler';
import { Message } from '../ChatMessage';

/**
 * Hook for managing query processing
 */
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
  // Set up retry handler without passing processQuery (avoiding circular dependency)
  const { retryLastQuery, setProcessQueryFn } = useRetryHandler(lastQuery, setInput);
  
  // Set up query execution - this is the main processing logic
  const { isLoading, processQuery } = useQueryExecution(
    messages,
    setMessages,
    setLastQuery,
    setInput,
    retryLastQuery,
    isGrokApiKeySet,
    setApiKeyDialogOpen
  );
  
  // Set up input handlers
  const { handleSend, handleKeyDown } = useQueryInputHandler(processQuery, input);

  // Set the processQuery function in the retry handler
  useEffect(() => {
    setProcessQueryFn(processQuery);
  }, [processQuery, setProcessQueryFn]);

  return {
    isLoading,
    handleSend,
    handleKeyDown,
    processQuery,
    retryLastQuery
  };
};
