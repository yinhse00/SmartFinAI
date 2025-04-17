
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Message } from '../ChatMessage';
import { setupLogging, logQueryStart, logContextInfo, logQueryParameters, finishLogging } from './useQueryLogger';

/**
 * Core functionality for query execution
 */
export const useQueryCore = (
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>,
  isGrokApiKeySet: boolean,
  setApiKeyDialogOpen: React.Dispatch<React.SetStateAction<boolean>>
) => {
  const [isLoading, setIsLoading] = useState(false);
  const [processingStage, setProcessingStage] = useState<'preparing' | 'processing' | 'finalizing' | 'reviewing'>('preparing');
  const { toast } = useToast();

  const startProcessing = (queryText: string) => {
    if (!queryText.trim()) return false;
    
    if (!isGrokApiKeySet) {
      setApiKeyDialogOpen(true);
      return false;
    }
    
    setIsLoading(true);
    // Always start with database review stage
    setProcessingStage('reviewing');
    return true;
  };
  
  const createUserMessage = (queryText: string, messages: Message[]): Message[] => {
    const userMessage: Message = {
      id: Date.now().toString(),
      content: queryText,
      sender: 'user',
      timestamp: new Date(),
    };
    
    return [...messages, userMessage];
  };
  
  const finishProcessing = () => {
    setIsLoading(false);
  };
  
  const setStage = (stage: 'preparing' | 'processing' | 'finalizing' | 'reviewing') => {
    setProcessingStage(stage);
  };

  const handleProcessingError = (error: any, updatedMessages: Message[]) => {
    console.error("Error in financial chat process:", error);
    
    // Add a fallback message even if overall process fails
    const fallbackMessage: Message = {
      id: Date.now().toString(),
      content: "I'm sorry, something went wrong. Please try again in a moment.",
      sender: 'bot',
      timestamp: new Date(),
      isError: true
    };
    
    setMessages([...updatedMessages, fallbackMessage]);
    
    toast({
      title: "Error",
      description: "An unexpected error occurred. Please try again.",
      variant: "destructive"
    });
    
    setIsLoading(false);
  };

  return {
    isLoading,
    processingStage,
    startProcessing,
    createUserMessage,
    finishProcessing,
    setStage,
    handleProcessingError,
    setupLogging
  };
};
