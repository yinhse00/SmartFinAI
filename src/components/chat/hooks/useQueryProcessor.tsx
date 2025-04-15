
import { useRetryHandler } from './useRetryHandler';
import { useQueryExecution } from './useQueryExecution';
import { useQueryInputHandler } from './useQueryInputHandler';
import { Message } from '../ChatMessage';

/**
 * Hook to manage query processing
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
  // Create a dummy processQuery that will be replaced with the real one after circular dependencies are resolved
  const dummyProcessQuery = async (query: string) => {};
  
  // Set up retry handler
  const { retryLastQuery } = useRetryHandler(lastQuery, setInput, dummyProcessQuery);
  
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

  // Override the retry handler's processQuery function with the real one
  (useRetryHandler as any).lastProcessQuery = processQuery;

  return {
    isLoading,
    handleSend,
    handleKeyDown,
    processQuery,
    retryLastQuery
  };
};
