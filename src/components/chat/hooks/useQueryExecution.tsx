
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
      
      // Check specifically for FAQ/continuing obligations queries
      const isFaqQuery = queryText.toLowerCase().includes('faq') || 
                        queryText.toLowerCase().includes('continuing obligation') ||
                        queryText.match(/\b10\.4\b/);
      
      // Get query parameters with optimized token settings
      const { financialQueryType, temperature, maxTokens } = determineQueryParameters(queryText);
      const enhancedMaxTokens = isSimpleQuery ? maxTokens * 2 : maxTokens * 10; // Use smaller limit for simple queries
      
      // Use lower temperature for FAQ queries to ensure accurate information retrieval
      const actualTemperature = isFaqQuery ? 0.2 : temperature;
      
      logQueryParameters(financialQueryType, actualTemperature, enhancedMaxTokens);
      
      // Always perform context retrieval for FAQ queries regardless of type
      let regulatoryContext = '';
      let reasoning = '';
      let contextTime = 0;
      
      if (!isSimpleQuery || isFaqQuery) {
        // Retrieve context for non-conversational queries or FAQ queries
        const contextStart = Date.now();
        const contextResult = await contextService.getRegulatoryContextWithReasoning(queryText);
        regulatoryContext = contextResult.context || '';
        reasoning = contextResult.reasoning || '';
        contextTime = Date.now() - contextStart;
        
        // For FAQ queries, check if we found relevant FAQ content
        if (isFaqQuery && !regulatoryContext.toLowerCase().includes('faq') && 
            !regulatoryContext.toLowerCase().includes('continuing obligation')) {
          console.log('FAQ query detected but no FAQ content found, searching specifically for FAQ content');
          // If no FAQ content found in the initial search, try a more focused search
          const faqContextResult = await contextService.getRegulatoryContextWithReasoning("FAQ continuing obligations");
          if (faqContextResult.context && 
             (faqContextResult.context.toLowerCase().includes('faq') || 
              faqContextResult.context.toLowerCase().includes('continuing obligation'))) {
            console.log('Found FAQ content in focused search, using this context instead');
            regulatoryContext = faqContextResult.context;
            reasoning = "This context is from the '10.4 FAQ Continuing Obligations' document which should be used verbatim for accurate answers.";
          }
        }
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
        actualTemperature, 
        enhancedMaxTokens
      );
      
      // For FAQ queries, add specific instructions
      if (isFaqQuery) {
        responseParams.prompt += " Please respond with the EXACT wording from the '10.4 FAQ Continuing Obligations' document. DO NOT paraphrase or use your own knowledge.";
      }
      
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
