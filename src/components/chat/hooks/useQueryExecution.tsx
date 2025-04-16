
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { contextService } from '@/services/regulatory/contextService';
import { useQueryParameters } from './useQueryParameters';
import { useResponseHandling } from './useResponseHandling';
import { useQueryLogger } from './useQueryLogger';
import { useQueryBuilder } from './useQueryBuilder';
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
  const { setupLogging, logQueryStart, logContextInfo, logQueryParameters, finishLogging } = useQueryLogger();
  const { buildResponseParams } = useQueryBuilder();

  // Set up logging
  setupLogging();

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
      logQueryStart(queryText);
      
      // Get optimal parameters for the query
      const { financialQueryType, temperature, maxTokens } = determineQueryParameters(queryText);
      logQueryParameters(financialQueryType, temperature, maxTokens);
      
      // Get regulatory context
      const { context: regulatoryContext, reasoning } = await contextService.getRegulatoryContextWithReasoning(queryText);
      logContextInfo(regulatoryContext, reasoning);
      
      // Build response parameters
      const responseParams = buildResponseParams(queryText, temperature, maxTokens, regulatoryContext);
      
      // Handle API response
      await handleApiResponse(
        queryText, 
        responseParams, 
        regulatoryContext, 
        reasoning, 
        financialQueryType,
        updatedMessages
      );
      
      finishLogging();
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
