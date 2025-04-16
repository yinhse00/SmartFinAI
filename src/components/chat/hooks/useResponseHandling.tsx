
import { useToast } from '@/hooks/use-toast';
import { grokService } from '@/services/grokService';
import { Message } from '../ChatMessage';
import { useResponseFormatter } from './useResponseFormatter';
import { useErrorHandling } from './useErrorHandling';
import { useResponseAnalysis } from './useResponseAnalysis';
import { useRetryStrategies } from './useRetryStrategies';
import { useFallbackDetection } from './useFallbackDetection';

/**
 * Hook for handling API responses with massively increased token limits
 */
export const useResponseHandling = (
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>,
  retryLastQuery: () => void,
  isGrokApiKeySet: boolean
) => {
  const { toast } = useToast();
  const { formatBotMessage, showTruncationToast } = useResponseFormatter();
  const { handleApiError, handleFallbackResponse } = useErrorHandling();
  const { analyzeResponseCompleteness, isQuerySimple, isQueryAggregationRelated } = useResponseAnalysis();
  const { enhanceParamsForRetry, determineMaxRetries } = useRetryStrategies();
  const { isFallbackResponse } = useFallbackDetection();

  const handleApiResponse = async (
    queryText: string,
    responseParams: any,
    regulatoryContext: string | undefined,
    reasoning: string | undefined,
    financialQueryType: string,
    processedMessages: Message[]
  ) => {
    try {
      console.log('Calling Grok financial expert API');
      
      // Determine if this is a simple conversational query
      const isSimpleQuery = isQuerySimple(queryText);
      
      // Boost token limit based on query complexity
      const baseTokenMultiplier = isSimpleQuery ? 2 : 3;
      responseParams.maxTokens = responseParams.maxTokens * baseTokenMultiplier;
      
      // Add specific instructions for aggregation-related queries
      if (queryText.toLowerCase().includes('rule 7.19a') || 
          queryText.toLowerCase().includes('aggregate') || 
          queryText.toLowerCase().includes('within 12 months')) {
        
        responseParams.prompt += " Ensure a complete explanation of the aggregation requirements, including how the 50% threshold is calculated, whether previous approvals affect subsequent issues, and provide a direct conclusion. Include all relevant rule references and requirements for independent shareholders' approval.";
        
        // Increase max tokens for these complex queries
        responseParams.maxTokens = Math.max(responseParams.maxTokens, 5000000);
      }
      
      // Add completion instruction to all prompts
      responseParams.prompt += " Please provide a complete and concise response.";
      
      // First attempt with significantly increased token limits
      console.log(`Initial request with tokens: ${responseParams.maxTokens}, temperature: ${responseParams.temperature}`);
      let response = await grokService.generateResponse(responseParams);
      
      // Check if it's using fallback
      const isUsingFallback = isFallbackResponse(response.text);
      
      if (isUsingFallback && isGrokApiKeySet) {
        handleFallbackResponse(isGrokApiKeySet);
      }
      
      // Analyze response completeness
      let completenessCheck = analyzeResponseCompleteness(
        response.text, 
        financialQueryType, 
        queryText, 
        isSimpleQuery
      );
      
      // Determine if this is an aggregation query for special handling
      const isAggregationQuery = isQueryAggregationRelated(queryText);
      
      // Determine maximum retries based on query complexity
      const maxRetries = determineMaxRetries(isSimpleQuery, isAggregationQuery);
      let retryCount = 0;
      
      // Log the completeness check results
      console.log(`Response completeness check - Complete: ${completenessCheck.isComplete}, Reasons: ${completenessCheck.reasons.join(', ')}`);
      
      // Retry logic for incomplete responses
      while (retryCount < maxRetries && !completenessCheck.isComplete && !isUsingFallback && isGrokApiKeySet) {
        console.log(`Response appears incomplete (attempt ${retryCount + 1}/${maxRetries}), retrying with enhanced parameters`);
        
        // Get enhanced parameters for this retry attempt
        const enhancedParams = enhanceParamsForRetry(
          responseParams, 
          retryCount, 
          isAggregationQuery,
          financialQueryType,
          queryText
        );
        
        console.log(`Retry #${retryCount + 1} with tokens: ${enhancedParams.maxTokens}, temperature: ${enhancedParams.temperature}`);
        
        try {
          // Execute retry with enhanced parameters
          response = await grokService.generateResponse(enhancedParams);
          console.log(`Retry #${retryCount + 1} completed, checking completeness`);
          
          // Re-analyze completeness
          completenessCheck = analyzeResponseCompleteness(
            response.text, 
            financialQueryType, 
            queryText, 
            isSimpleQuery
          );
          
          console.log(`Retry #${retryCount + 1} result - Complete: ${completenessCheck.isComplete}, Reasons: ${completenessCheck.reasons.join(', ')}`);
          
          // If complete, break out of retry loop immediately to save time
          if (completenessCheck.isComplete) {
            console.log('Received complete response, breaking retry loop');
            break;
          }
        } catch (retryError) {
          console.error(`Retry #${retryCount + 1} failed:`, retryError);
          // Continue with previous response if retry fails
        }
        
        retryCount++;
      }
      
      // Format the bot message
      const botMessage = formatBotMessage(response, regulatoryContext, reasoning, isUsingFallback);
      
      // Only mark as truncated for non-simple queries
      if (!isSimpleQuery && !completenessCheck.isComplete) {
        console.log('Incomplete response detected after all retries:', {
          reasons: completenessCheck.reasons,
          financialAnalysisMissingElements: completenessCheck.financialAnalysis.missingElements
        });
        
        botMessage.isTruncated = true;
      }
      
      setMessages([...processedMessages, botMessage]);
      console.log('Response delivered successfully');
      
      if (botMessage.isTruncated) {
        console.log('Response appears to be truncated, showing retry option');
        const diagnostics = completenessCheck.reasons.length > 0 
          ? { reasons: completenessCheck.reasons } 
          : { reasons: ['Response appears incomplete'] };
          
        showTruncationToast(diagnostics, completenessCheck.financialAnalysis, retryLastQuery);
      }
      
      return botMessage;
    } catch (error) {
      const errorMessage = handleApiError(error, processedMessages);
      setMessages([...processedMessages, errorMessage]);
      return errorMessage;
    }
  };

  return {
    handleApiResponse
  };
};
