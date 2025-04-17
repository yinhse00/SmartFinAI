
import { useToast } from '@/hooks/use-toast';
import { useQueryLogger } from './useQueryLogger';
import { useResponseHandling } from './useResponseHandling';
import { useQueryCore } from './useQueryCore';
import { useContextRetrieval } from './useContextRetrieval';
import { useQueryPreparation } from './useQueryPreparation';
import { Message } from '../ChatMessage';

/**
 * Hook for executing queries and managing the response flow
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
  const { logQueryStart, logContextInfo, logQueryParameters, finishLogging } = useQueryLogger();
  const { handleApiResponse } = useResponseHandling(setMessages, retryLastQuery, isGrokApiKeySet);
  const { 
    isLoading, 
    processingStage, 
    startProcessing, 
    createUserMessage,
    finishProcessing,
    setStage,
    handleProcessingError,
    setupLogging
  } = useQueryCore(setMessages, isGrokApiKeySet, setApiKeyDialogOpen);
  const { retrieveRegulatoryContext } = useContextRetrieval();
  const { prepareQuery } = useQueryPreparation();
  
  setupLogging();

  const processQuery = async (queryText: string) => {
    // Validate and start processing
    if (!startProcessing(queryText)) return;
    setLastQuery(queryText);
    
    // Create and add user message
    const updatedMessages = createUserMessage(queryText, messages);
    setMessages(updatedMessages);
    setInput('');

    try {
      // Start logging
      logQueryStart(queryText);
      
      // Step 1: Prepare query parameters and determine query type (preliminary analysis)
      console.log("Step 1: Initial analysis of query");
      const { 
        responseParams, 
        financialQueryType, 
        isFaqQuery,
        actualTemperature,
        enhancedMaxTokens 
      } = prepareQuery(queryText);
      
      // Log query parameters
      logQueryParameters(financialQueryType, actualTemperature, enhancedMaxTokens);
      
      // Step 2: Check Summary and Keyword Index first before full database search
      console.log("Step 2: Checking Summary and Keyword Index for quick answers");
      // Set stage to reflect we're reviewing the database
      setStage('reviewing');
      
      // Step 3: Retrieve regulatory context with optimized search
      // Ensure we're passing a boolean for isFaqQuery
      console.log("Step 3: Retrieving relevant regulatory context with optimized search");
      const { regulatoryContext, reasoning, contextTime, usedSummaryIndex } = await retrieveRegulatoryContext(
        queryText, 
        !!isFaqQuery // Explicit boolean conversion
      );
      
      // Log context info
      logContextInfo(
        regulatoryContext, 
        reasoning, 
        financialQueryType || 'unspecified', 
        contextTime
      );
      
      if (usedSummaryIndex) {
        console.log("Used Summary Index for faster context retrieval");
      }
      
      // Update processing stage
      setStage('processing');
      
      // Step 4: Process response with Grok API using retrieved context
      console.log("Step 4: Generating response with Grok API");
      const processingStart = Date.now();
      
      try {
        await handleApiResponse(
          queryText, 
          responseParams, 
          regulatoryContext,
          reasoning,
          financialQueryType || 'unspecified',
          updatedMessages
        );
        const processingTime = Date.now() - processingStart;
        console.log(`Response generated in ${processingTime}ms`);
      } catch (responseError) {
        console.error("Error generating response:", responseError);
        
        // Add a partial response message if the API call failed
        const errorMessage: Message = {
          id: Date.now().toString(),
          content: "I apologize, but I encountered an issue while processing your request. Please try again or rephrase your question.",
          sender: 'bot',
          timestamp: new Date(),
          isError: true
        };
        
        setMessages([...updatedMessages, errorMessage]);
      }
      
      // Final stage
      setStage('finalizing');
      
      // Determine appropriate finalization delay
      const isSimpleQuery = financialQueryType === 'conversational';
      const finalizingTime = isSimpleQuery ? 150 : 250;
      await new Promise(resolve => setTimeout(resolve, finalizingTime));
      
      finishLogging();
    } catch (error) {
      handleProcessingError(error, updatedMessages);
    } finally {
      finishProcessing();
    }
  };

  return {
    isLoading,
    processingStage,
    processQuery
  };
};
