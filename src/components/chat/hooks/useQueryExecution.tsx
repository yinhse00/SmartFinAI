
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

      logQueryParameters(financialQueryType, actualTemperature, enhancedMaxTokens);

      // Step 2: Professional reviewing stage - emphasize verification and preparation
      setProcessingStage('reviewing');
      const reviewingStart = Date.now();

      // Step 3: Retrieve regulatory context with verification focus
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

      const reviewingTime = Date.now() - reviewingStart;
      console.log(`Content verification and preparation completed in ${reviewingTime}ms`);

      // Step 4: Process response with professional tone and verified content
      setProcessingStage('processing');

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
      console.log(`Professional response generated in ${processingTime}ms`);

      // Step 5: Finalizing with professional presentation
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
      handleProcessingError(error, updatedMessages);
    }
  };

  return {
    executeQuery
  };
};

