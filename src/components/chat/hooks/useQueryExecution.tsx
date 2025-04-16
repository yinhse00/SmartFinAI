
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
  const [processingStage, setProcessingStage] = useState<'preparing' | 'processing' | 'finalizing' | 'reviewing'>('preparing');
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
      
      // Enhanced detection for FAQ/continuing obligations queries
      const isFaqQuery = queryText.toLowerCase().includes('faq') || 
                        queryText.toLowerCase().includes('continuing obligation') ||
                        queryText.match(/\b10\.4\b/) ||
                        queryText.toLowerCase().includes('obligation') ||
                        queryText.toLowerCase().includes('requirements');
      
      // Get query parameters with optimized token settings
      const { financialQueryType, temperature, maxTokens } = determineQueryParameters(queryText);
      const enhancedMaxTokens = isSimpleQuery ? maxTokens * 2 : maxTokens * 10; // Use smaller limit for simple queries
      
      // Use much lower temperature for FAQ queries to ensure more literal information retrieval
      const actualTemperature = isFaqQuery ? 0.1 : temperature;
      
      logQueryParameters(financialQueryType, actualTemperature, enhancedMaxTokens);
      
      // Always perform comprehensive context retrieval for FAQ queries regardless of type
      let regulatoryContext = '';
      let reasoning = '';
      let contextTime = 0;
      
      setProcessingStage('reviewing');
      
      // Always do a comprehensive database review for non-conversational queries or FAQ queries
      if (!isSimpleQuery || isFaqQuery) {
        // More comprehensive context retrieval with database verification
        const contextStart = Date.now();
        const contextResult = await contextService.getComprehensiveRegulatoryContext(queryText);
        regulatoryContext = contextResult.context || '';
        reasoning = contextResult.reasoning || '';
        contextTime = Date.now() - contextStart;
        
        // For FAQ queries, ensure we've searched across multiple potential sources
        if (isFaqQuery) {
          console.log('FAQ query detected, performing thorough database search for all relevant FAQ content');
          
          // If initial search didn't yield strong FAQ content, try multiple search strategies
          if (!regulatoryContext.toLowerCase().includes('faq') && 
              !regulatoryContext.toLowerCase().includes('continuing obligation')) {
            console.log('Initial search didn\'t find specific FAQ content, trying specialized search');
            
            // Try with multiple variants of the FAQ search query
            const faqSearchQueries = [
              "10.4 FAQ Continuing Obligations",
              "FAQ continuing obligations",
              "continuing obligations FAQ",
              "10.4 FAQ"
            ];
            
            for (const faqQuery of faqSearchQueries) {
              console.log(`Trying specialized FAQ search with query: ${faqQuery}`);
              const faqContextResult = await contextService.getRegulatoryContextWithReasoning(faqQuery);
              
              if (faqContextResult.context && 
                 (faqContextResult.context.toLowerCase().includes('faq') || 
                  faqContextResult.context.toLowerCase().includes('continuing obligation'))) {
                console.log('Found FAQ content in specialized search, using this context');
                regulatoryContext = faqContextResult.context;
                reasoning = "This context is from the '10.4 FAQ Continuing Obligations' document which contains the exact wording needed for accurate answers.";
                break;
              }
            }
          }
        }
      }
      
      // Log context info
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
      
      // For FAQ queries, add explicit instructions to use exact wording
      if (isFaqQuery) {
        responseParams.prompt += " IMPORTANT: For questions related to FAQs or continuing obligations, you MUST use the EXACT wording from the provided database entries. DO NOT paraphrase, summarize or use your own knowledge. Extract and quote the relevant FAQ question and answer from the '10.4 FAQ Continuing Obligations' document verbatim. If no exact match is found, explicitly state that.";
      }
      
      // For all queries, emphasize database content priority
      responseParams.prompt += " Always prioritize information from the regulatory database over general knowledge. When regulatory guidance exists in the database, use it verbatim.";
      
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
