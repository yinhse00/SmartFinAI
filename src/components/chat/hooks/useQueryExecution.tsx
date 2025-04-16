
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { contextService } from '@/services/regulatory/contextService';
import { useQueryParameters } from './useQueryParameters';
import { useResponseHandling } from './useResponseHandling';
import { useQueryLogger } from './useQueryLogger';
import { useQueryBuilder } from './useQueryBuilder';
import { Message } from '../ChatMessage';

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
  const [processingStage, setProcessingStage] = useState<'preparing' | 'processing' | 'finalizing'>('preparing');
  const { toast } = useToast();
  const { determineQueryParameters } = useQueryParameters();
  const { handleApiResponse } = useResponseHandling(setMessages, retryLastQuery, isGrokApiKeySet);
  const { setupLogging, logQueryStart, logContextInfo, logQueryParameters, finishLogging } = useQueryLogger();
  const { buildResponseParams } = useQueryBuilder();

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
    setProcessingStage('preparing');

    try {
      logQueryStart(queryText);
      
      // Increase token limits significantly - 10x the original limit
      const { financialQueryType, temperature, maxTokens } = determineQueryParameters(queryText);
      const enhancedMaxTokens = maxTokens * 10; // Dramatically increase token limit
      
      logQueryParameters(financialQueryType, temperature, enhancedMaxTokens);
      
      const contextStart = Date.now();
      const { context: regulatoryContext, reasoning } = await contextService.getRegulatoryContextWithReasoning(queryText);
      const contextTime = Date.now() - contextStart;
      
      // Ensure all 4 arguments are passed to logContextInfo
      logContextInfo(
        regulatoryContext || '', 
        reasoning || '', 
        financialQueryType || 'unspecified', 
        contextTime
      );
      
      setProcessingStage('processing');
      
      // Build response parameters with massive token limits
      const responseParams = buildResponseParams(queryText, temperature, enhancedMaxTokens);
      
      const processingStart = Date.now();
      const result = await handleApiResponse(
        queryText, 
        responseParams, 
        regulatoryContext || '',  
        reasoning || '',
        financialQueryType || 'unspecified',
        updatedMessages
      );
      const processingTime = Date.now() - processingStart;
      console.log(`Response generated in ${processingTime}ms`);
      
      setProcessingStage('finalizing');
      
      // Slightly reduced finalizing wait time
      await new Promise(resolve => setTimeout(resolve, 250));
      
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
    processingStage,
    processQuery
  };
};
