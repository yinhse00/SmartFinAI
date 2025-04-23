
import { useToast } from '@/hooks/use-toast';
import { useQueryLogger } from './useQueryLogger';
import { useResponseHandling } from './useResponseHandling';
import { useQueryCore } from './useQueryCore';
import { useContextRetrieval } from './useContextRetrieval';
import { useQueryPreparation } from './useQueryPreparation';
import { Message } from '../ChatMessage';

// Add: batchInfo arg and onBatchTruncated callback
export const useQueryExecution = (
  messages: Message[],
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>,
  setLastQuery: React.Dispatch<React.SetStateAction<string>>,
  setInput: React.Dispatch<React.SetStateAction<string>>,
  retryLastQuery: () => void,
  isGrokApiKeySet: boolean,
  setApiKeyDialogOpen: React.Dispatch<React.SetStateAction<boolean>>
) => {
  const { toast } = useToast();
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

  // batchInfo: { batchNumber, isContinuing }, onBatchTruncated: callback
  const processQuery = async (
    queryText: string,
    batchInfo?: { batchNumber: number, isContinuing: boolean },
    onBatchTruncated?: (isTruncated: boolean) => void
  ) => {
    if (!startProcessing(queryText)) return;
    setLastQuery(queryText);
    const updatedMessages = createUserMessage(queryText, messages);

    setMessages(updatedMessages);
    setInput('');

    try {
      logQueryStart(queryText);

      // Step 1: Prepare query parameters and determine query type (preliminary analysis)
      const {
        responseParams,
        financialQueryType,
        isFaqQuery,
        actualTemperature,
        enhancedMaxTokens
      } = prepareQuery(queryText);

      logQueryParameters(financialQueryType, actualTemperature, enhancedMaxTokens);

      setStage('reviewing');

      // Step 3: Retrieve regulatory context
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

      setStage('processing');

      // Add searchStrategy for prompt engineering
      responseParams.searchStrategy = searchStrategy;

      // Step 4: Process response
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
      console.log(`Response generated in ${processingTime}ms`);

      setStage('finalizing');

      const isSimpleQuery = financialQueryType === 'conversational';
      const finalizingTime = isSimpleQuery ? 150 : 250;
      await new Promise(resolve => setTimeout(resolve, finalizingTime));

      finishLogging();

      // If the message is truncated and this is a batch, trigger the callback:
      if (batchInfo && result && result.isTruncated) {
        if (onBatchTruncated) onBatchTruncated(true);
      } else if (onBatchTruncated) {
        onBatchTruncated(false);
      }

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
