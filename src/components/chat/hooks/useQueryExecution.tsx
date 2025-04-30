
import { useToast } from '@/hooks/use-toast';
import { useQueryLogger } from './useQueryLogger';
import { useResponseHandling } from './useResponseHandling';
import { useQueryCore } from './useQueryCore';
import { useContextRetrieval } from './useContextRetrieval';
import { useQueryPreparation } from './useQueryPreparation';
import { Message } from '../ChatMessage';

export const useQueryExecution = (
  messages: Message[],
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>,
  setLastQuery: React.Dispatch<React.SetStateAction<string>>,
  setInput: React.Dispatch<React.SetStateAction<string>>,
  retryLastQuery: () => void,
  isGrokApiKeySet: boolean,
  setApiKeyDialogOpen: React.Dispatch<React.SetStateAction<boolean>>,
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>,
  setProcessingStage: React.Dispatch<React.SetStateAction<'preparing' | 'processing' | 'finalizing' | 'reviewing'>>
) => {
  const { toast } = useToast();
  const { logQueryStart, logContextInfo, logQueryParameters, finishLogging } = useQueryLogger();
  const { handleApiResponse } = useResponseHandling(setMessages, retryLastQuery, isGrokApiKeySet);
  const { createUserMessage, handleProcessingError } = useQueryCore(setMessages, isGrokApiKeySet, setApiKeyDialogOpen);
  const { retrieveRegulatoryContext } = useContextRetrieval();
  const { prepareQuery } = useQueryPreparation();

  // The main execution function - optimized for performance
  const executeQuery = async (
    queryText: string,
    batchInfo?: { batchNumber: number, isContinuing: boolean },
    onBatchTruncated?: (isTruncated: boolean) => void
  ) => {
    // Quick validation check
    if (!queryText?.trim()) {
      console.log('Empty query, skipping execution');
      return;
    }
    
    // Check for API key
    if (!isGrokApiKeySet) {
      setApiKeyDialogOpen(true);
      return;
    }
    
    // Performance optimization: immediately update UI state
    setLastQuery(queryText);
    const updatedMessages = createUserMessage(queryText, messages);
    setMessages(updatedMessages);
    setInput('');
    setIsLoading(true);

    // Track execution performance
    const executionStart = performance.now();

    try {
      logQueryStart(queryText);

      // Step 1: Prepare query parameters - optimize with memoization for subsequent queries
      setProcessingStage('preparing');
      const {
        responseParams,
        financialQueryType,
        isFaqQuery,
        actualTemperature,
        enhancedMaxTokens
      } = prepareQuery(queryText);

      logQueryParameters(financialQueryType, actualTemperature, enhancedMaxTokens);

      // Step 2: Retrieve regulatory context with timeout protection
      setProcessingStage('reviewing');
      let contextPromise = retrieveRegulatoryContext(queryText, Boolean(isFaqQuery));
      
      // Set a timeout for context retrieval to prevent hanging
      const contextTimeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Context retrieval timeout')), 15000)
      );
      
      // Use Promise.race to implement timeout
      const {
        regulatoryContext,
        reasoning,
        contextTime,
        usedSummaryIndex,
        searchStrategy
      } = await Promise.race([contextPromise, contextTimeoutPromise]).catch(error => {
        console.warn('Context retrieval issue:', error);
        return { 
          regulatoryContext: undefined, 
          reasoning: 'Fallback reasoning due to context retrieval timeout',
          contextTime: 0,
          usedSummaryIndex: false,
          searchStrategy: 'fallback'
        };
      });

      logContextInfo(
        regulatoryContext,
        reasoning,
        financialQueryType || 'unspecified',
        contextTime,
        searchStrategy
      );

      // Step 3: Process response with performance tracking
      setProcessingStage('processing');
      const processingStart = performance.now();

      const result = await handleApiResponse(
        queryText,
        responseParams,
        regulatoryContext,
        reasoning,
        financialQueryType || 'unspecified',
        updatedMessages,
        batchInfo
      );

      const processingTime = performance.now() - processingStart;
      console.log(`Response generated in ${processingTime}ms`);

      // Step 4: Finalize with controlled timing to prevent UI jank
      setProcessingStage('finalizing');
      const isSimpleQuery = financialQueryType === 'conversational';
      const finalizingTime = isSimpleQuery ? 150 : 250;
      await new Promise(resolve => setTimeout(resolve, finalizingTime));

      finishLogging();

      // Handle batch truncation
      if (batchInfo && result && result.isTruncated) {
        if (onBatchTruncated) onBatchTruncated(true);
      } else if (onBatchTruncated) {
        onBatchTruncated(false);
      }

      // Log total execution time
      const totalTime = performance.now() - executionStart;
      console.log(`Total query execution completed in ${totalTime}ms`);

    } catch (error) {
      console.error('Error during query execution:', error);
      handleProcessingError(error, updatedMessages);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    executeQuery
  };
};
