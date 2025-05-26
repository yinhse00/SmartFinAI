
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
  const { handleApiResponse, isValidating } = useResponseHandling(setMessages, retryLastQuery, isGrokApiKeySet);
  const { createUserMessage, handleProcessingError } = useQueryCore(setMessages, isGrokApiKeySet, setApiKeyDialogOpen);
  const { retrieveRegulatoryContext } = useContextRetrieval();
  const { prepareQuery } = useQueryPreparation();

  // The main execution function with enhanced validation
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

      // Step 3: Retrieve enhanced regulatory context with vetting and guidance validation
      const {
        regulatoryContext,
        reasoning,
        contextTime,
        usedSummaryIndex,
        searchStrategy,
        enhancedContext // This now includes vetting and guidance info
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
      console.log(`Enhanced content verification and preparation completed in ${reviewingTime}ms`);

      // Step 4: Process response with professional tone and enhanced validation
      setProcessingStage('processing');

      const processingStart = Date.now();

      const result = await handleApiResponse(
        queryText,
        responseParams,
        regulatoryContext,
        reasoning,
        financialQueryType || 'unspecified',
        updatedMessages,
        batchInfo,
        enhancedContext // Pass enhanced context for validation
      );

      const processingTime = Date.now() - processingStart;
      console.log(`Enhanced professional response generated in ${processingTime}ms`);

      // Step 5: Finalizing with professional presentation and validation display
      setProcessingStage('finalizing');

      const isSimpleQuery = financialQueryType === 'conversational';
      const finalizingTime = isSimpleQuery ? 150 : 250;
      await new Promise(resolve => setTimeout(resolve, finalizingTime));

      // Show validation results if available
      if (result.validationResult && !result.validationResult.isValid) {
        toast({
          title: "Response Validation Notice",
          description: `Response validation identified potential issues: ${result.validationResult.validationNotes.join(', ')}`,
          variant: "default",
          duration: 5000,
        });
      }

      // Show vetting requirement notice if applicable
      if (enhancedContext?.vettingInfo?.isRequired) {
        toast({
          title: "Vetting Requirement Detected",
          description: `This type of announcement requires pre-vetting by the Exchange`,
          variant: "default",
          duration: 4000,
        });
      }

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
    executeQuery,
    isValidating
  };
};
