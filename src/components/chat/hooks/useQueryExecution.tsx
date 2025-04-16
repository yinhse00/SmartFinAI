
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { grokService } from '@/services/grokService';
import { contextService } from '@/services/regulatory/contextService';
import { useQueryParameters } from './useQueryParameters';
import { useResponseHandling } from './useResponseHandling';
import { setTruncationLogLevel, LogLevel } from '@/utils/truncation';
import { Message } from '../ChatMessage';

/**
 * Hook for handling query execution logic
 */
export const useQueryExecution = (
  messages: Message[],
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>,
  setLastQuery: React.Dispatch<React.SetStateAction<string>>,
  setInput: React.Dispatch<React.SetStateAction<string>>,
  retryLastQuery: () => void,
  isGrokApiKeySet: boolean,
  setApiKeyDialogOpen: React.Dispatch<React.SetStateAction<boolean>>
) => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { determineQueryParameters } = useQueryParameters();
  const { handleApiResponse } = useResponseHandling(setMessages, retryLastQuery, isGrokApiKeySet);

  // Enable debug logging for truncation detection in development
  if (process.env.NODE_ENV === 'development') {
    setTruncationLogLevel(LogLevel.DEBUG);
  }

  const processQuery = async (queryText: string) => {
    if (!queryText.trim()) return;
    
    if (!isGrokApiKeySet) {
      setApiKeyDialogOpen(true);
      return;
    }
    
    setLastQuery(queryText);

    const userMessage: Message = {
      id: Date.now().toString(),
      content: queryText,
      sender: 'user',
      timestamp: new Date(),
    };
    
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput('');
    setIsLoading(true);

    try {
      console.group('Financial Query Processing');
      
      // Get optimal parameters for the query
      const { financialQueryType, temperature, maxTokens } = determineQueryParameters(queryText);
      
      const responseParams: any = {
        prompt: queryText,
        temperature: temperature,
        maxTokens: maxTokens
      };
      
      // Get regulatory context
      const { context: regulatoryContext, reasoning } = await contextService.getRegulatoryContextWithReasoning(queryText);
      responseParams.regulatoryContext = regulatoryContext;
      
      console.log('Financial Context Length:', regulatoryContext?.length);
      console.log('Financial Reasoning:', reasoning);
      
      // Handle API response
      await handleApiResponse(
        queryText, 
        responseParams, 
        regulatoryContext, 
        reasoning, 
        financialQueryType,
        updatedMessages
      );
      
      console.groupEnd();
    } catch (error) {
      console.error("Error in financial chat process:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    processQuery
  };
};
