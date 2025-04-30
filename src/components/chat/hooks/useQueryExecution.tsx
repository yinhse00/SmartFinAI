
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

  // Simple deterministic hashing function for consistent request IDs
  const createSimpleHash = (text: string): number => {
    let hash = 0;
    if (!text || text.length === 0) return hash;
    
    for (let i = 0; i < text.length; i++) {
      const char = text.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    
    return Math.abs(hash);
  };

  // The main execution function
  const executeQuery = async (
    queryText: string,
    batchInfo?: { batchNumber: number, isContinuing: boolean },
    onBatchTruncated?: (isTruncated: boolean) => void
  ) => {
    if (!queryText.trim()) return;
    
    if (!isGrokApiKeySet) {
      setApiKeyDialogOpen(true);
      return;
    }
    
    // Generate a deterministic request ID that will be the same in both environments
    const contentHash = createSimpleHash(queryText);
    const requestId = `req_${contentHash}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    console.log(`Processing request ${requestId} with query: ${queryText.substring(0, 50)}...`);
    
    setLastQuery(queryText);
    const updatedMessages = createUserMessage(queryText, messages);

    setMessages(updatedMessages);
    setInput('');

    try {
      logQueryStart(queryText);

      // Step 1: Prepare query parameters and determine query type
      const {
        responseParams,
        financialQueryType,
        isFaqQuery,
        actualTemperature,
        enhancedMaxTokens
      } = prepareQuery(queryText);
      
      // Add consistency markers
      responseParams.requestId = requestId;
      responseParams.consistencyMode = true;
      responseParams.envSignature = 'unified-env-2.0';
      responseParams.useStableParameters = true;
      responseParams.seed = contentHash; // Add deterministic seed

      logQueryParameters(financialQueryType, actualTemperature, enhancedMaxTokens);

      setProcessingStage('reviewing');

      // Step 2: Retrieve regulatory context
      const {
        regulatoryContext,
        reasoning,
        contextTime,
        usedSummaryIndex,
        searchStrategy
      } = await retrieveRegulatoryContext(
        queryText,
        Boolean(isFaqQuery)
      );

      logContextInfo(
        regulatoryContext,
        reasoning,
        financialQueryType || 'unspecified',
        contextTime,
        searchStrategy
      );

      setProcessingStage('processing');

      // Step 3: Process response
      const processingStart = Date.now();

      const result = await handleApiResponse(
        queryText,
        responseParams,
        regulatoryContext,
        reasoning,
        financialQueryType || 'unspecified',
        updatedMessages,
        batchInfo
      );

      const processingTime = Date.now() - processingStart;
      console.log(`Response generated in ${processingTime}ms for request ${requestId}`);

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

    } catch (error) {
      console.error(`Error processing request ${requestId}:`, error);
      handleProcessingError(error, updatedMessages);
    }
  };

  return {
    executeQuery
  };
};
