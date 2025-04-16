
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { contextService } from '@/services/regulatory/contextService';
import { useQueryParameters } from './useQueryParameters';
import { useResponseHandling } from './useResponseHandling';
import { useQueryLogger } from './useQueryLogger';
import { useQueryBuilder } from './useQueryBuilder';
import { Message } from '../ChatMessage';
import { isSimpleConversationalQuery } from '@/services/financial/expertiseDetection';

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
      
      // Check if this is a simple conversational query
      const isSimpleQuery = isSimpleConversationalQuery(queryText);
      console.log(`Query type: ${isSimpleQuery ? 'Conversational' : 'Financial/Regulatory'}`);
      
      // Get query parameters with optimized token settings
      const { financialQueryType, temperature, maxTokens } = determineQueryParameters(queryText);
      const enhancedMaxTokens = isSimpleQuery ? maxTokens * 2 : maxTokens * 10; // Use smaller limit for simple queries
      
      logQueryParameters(financialQueryType, temperature, enhancedMaxTokens);
      
      // Skip context retrieval for simple conversational queries
      let regulatoryContext = '';
      let reasoning = '';
      let contextTime = 0;
      
      if (!isSimpleQuery) {
        // Only perform context search for non-conversational queries
        const contextStart = Date.now();
        const contextResult = await contextService.getRegulatoryContextWithReasoning(queryText);
        regulatoryContext = contextResult.context || '';
        reasoning = contextResult.reasoning || '';
        contextTime = Date.now() - contextStart;
      }
      
      // Log context info (with empty values for simple queries)
      logContextInfo(
        regulatoryContext, 
        reasoning, 
        financialQueryType || 'unspecified', 
        contextTime
      );
      
      setProcessingStage('processing');
      
      // Build optimized response parameters
      const responseParams = buildResponseParams(
        queryText, 
        temperature, 
        enhancedMaxTokens
      );
      
      const processingStart = Date.now();
      const result = await handleApiResponse(
        queryText, 
        responseParams, 
        regulatoryContext,
        reasoning,
        financialQueryType || 'unspecified',
        updatedMessages
      );
      const processingTime = Date.now() - processingStart;
      console.log(`Response generated in ${processingTime}ms`);
      
      setProcessingStage('finalizing');
      
      // Reduced finalizing wait time for simple queries
      const finalizingTime = isSimpleQuery ? 150 : 250;
      await new Promise(resolve => setTimeout(resolve, finalizingTime));
      
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
