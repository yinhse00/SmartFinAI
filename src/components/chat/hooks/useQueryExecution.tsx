import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { contextService } from '@/services/regulatory/contextService';
import { useQueryParameters } from './useQueryParameters';
import { useResponseHandling } from './useResponseHandling';
import { useQueryLogger } from './useQueryLogger';
import { useQueryBuilder } from './useQueryBuilder';
import { Message } from '../ChatMessage';

/**
 * Hook for handling query execution logic with optimized processing times
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
  const [processingStage, setProcessingStage] = useState<'preparing' | 'processing' | 'finalizing'>('preparing');
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
    setProcessingStage('preparing');

    try {
      logQueryStart(queryText);
      
      // Get optimal parameters for the query with significantly higher token limits
      const { financialQueryType, temperature, maxTokens } = determineQueryParameters(queryText);
      logQueryParameters(financialQueryType, temperature, maxTokens);
      
      // Optimize context fetching time with more focused approach
      console.log('Collecting focused regulatory context...');
      const contextStart = Date.now();
      const { context: regulatoryContext, reasoning } = await contextService.getRegulatoryContextWithReasoning(queryText);
      const contextTime = Date.now() - contextStart;
      
      // Pass all 4 arguments to logContextInfo, ensuring we provide a fallback or default value if needed
      logContextInfo(
        regulatoryContext ?? '', 
        reasoning ?? '', 
        financialQueryType,
        contextTime
      );
      
      // Update processing stage - now we're actually processing the query
      setProcessingStage('processing');
      console.log('Processing query with regulatory context...');
      
      // Build response parameters with massive token limits to reduce truncation
      // Preemptively use 3x the initial token limit to reduce need for retries
      const responseParams = buildResponseParams(queryText, temperature, maxTokens * 3);
      
      // Handle API response
      console.log('Generating response...');
      const processingStart = Date.now();
      const result = await handleApiResponse(
        queryText, 
        responseParams, 
        regulatoryContext, 
        reasoning, 
        financialQueryType,
        updatedMessages
      );
      const processingTime = Date.now() - processingStart;
      console.log(`Response generated in ${processingTime}ms`);
      
      // Final processing
      setProcessingStage('finalizing');
      console.log('Finalizing response...');
      
      // Ultra-short finalizing stage for better UX
      await new Promise(resolve => setTimeout(resolve, 300));
      
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
