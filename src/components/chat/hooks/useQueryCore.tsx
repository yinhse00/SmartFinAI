
import { useToast } from '@/hooks/use-toast';
import { Message } from '../ChatMessage';

/**
 * Core functionality for query execution
 */
export const useQueryCore = (
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>,
  isGrokApiKeySet: boolean,
  setApiKeyDialogOpen: React.Dispatch<React.SetStateAction<boolean>>
) => {
  const { toast } = useToast();

  // Create a user message for the query
  const createUserMessage = (queryText: string, messages: Message[]): Message[] => {
    const userMessage: Message = {
      id: Date.now().toString(),
      content: queryText,
      isUser: true,
      timestamp: new Date(),
    };
    
    return [...messages, userMessage];
  };

  // Handle processing errors in a consistent way
  const handleProcessingError = (error: any, updatedMessages: Message[]) => {
    console.error("Error in financial chat process:", error);
    
    // Add a fallback message even if overall process fails
    const fallbackMessage: Message = {
      id: Date.now().toString(),
      content: "I'm sorry, something went wrong. Please try again in a moment.",
      isUser: false,
      timestamp: new Date(),
      isError: true
    };
    
    setMessages([...updatedMessages, fallbackMessage]);
    
    toast({
      title: "Error",
      description: "An unexpected error occurred. Please try again.",
      variant: "destructive"
    });
  };

  return {
    createUserMessage,
    handleProcessingError
  };
};
