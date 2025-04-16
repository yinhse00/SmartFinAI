
import { useToast } from '@/hooks/use-toast';
import { grokService } from '@/services/grokService';
import { getTruncationDiagnostics } from '@/utils/truncation';
import { Message } from '../ChatMessage';
import { useResponseFormatter } from './useResponseFormatter';
import { useTruncationDetection, isTradingArrangementRelated } from './useTruncationDetection';
import { useErrorHandling } from './useErrorHandling';

/**
 * Hook for handling API responses
 */
export const useResponseHandling = (
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>,
  retryLastQuery: () => void,
  isGrokApiKeySet: boolean
) => {
  const { toast } = useToast();
  const { formatBotMessage, showTruncationToast } = useResponseFormatter();
  const { isResponseComplete } = useTruncationDetection();
  const { handleApiError, handleFallbackResponse } = useErrorHandling();

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
      
      // First attempt
      let response = await grokService.generateResponse(responseParams);
      
      // Check if it's using fallback
      const isUsingFallback = response.text.includes("Based on your query about") || 
                             response.text.includes("Regarding your query about") ||
                             response.text.includes("In response to your query");
      
      if (isUsingFallback && isGrokApiKeySet) {
        handleFallbackResponse(isGrokApiKeySet);
      }
      
      // Get basic diagnostics
      const diagnostics = getTruncationDiagnostics(response.text);
      
      // Do comprehensive completeness check
      const completenessCheck = isResponseComplete(
        response.text, 
        diagnostics, 
        financialQueryType, 
        queryText
      );

      // If detected as incomplete on first pass, try once more with higher token limit
      if (!completenessCheck.isComplete && !isUsingFallback && isGrokApiKeySet) {
        console.log('Initial response appears incomplete, retrying with higher token limit');
        
        // Increase token limit by 50% and try again for first retry
        const increasedTokens = Math.floor(responseParams.maxTokens * 1.5);
        const enhancedParams = {
          ...responseParams,
          maxTokens: increasedTokens,
          temperature: Math.max(0.01, responseParams.temperature * 0.8) // Lower temperature slightly
        };
        
        console.log(`Retrying with increased tokens: ${increasedTokens}`);
        
        // First retry attempt with increased tokens
        try {
          response = await grokService.generateResponse(enhancedParams);
          console.log('Auto-retry completed, checking completeness of new response');
          
          // Re-check completeness
          const newDiagnostics = getTruncationDiagnostics(response.text);
          const newCompletenessCheck = isResponseComplete(
            response.text,
            newDiagnostics,
            financialQueryType,
            queryText
          );
          
          // If still incomplete and it's a complex financial query, try one more time with much higher tokens
          if (!newCompletenessCheck.isComplete && 
              (financialQueryType === 'rights_issue' || 
               queryText.toLowerCase().includes('difference between') ||
               queryText.toLowerCase().includes('compare'))) {
            
            console.log('Response still incomplete after first retry, attempting second retry with much higher token limit');
            
            // Double the tokens for second retry and use very low temperature
            const finalRetryParams = {
              ...responseParams,
              maxTokens: responseParams.maxTokens * 2, // Double the original token count
              temperature: 0.1 // Very low temperature for precision
            };
            
            console.log(`Second retry with tokens: ${finalRetryParams.maxTokens}`);
            
            try {
              response = await grokService.generateResponse(finalRetryParams);
              console.log('Second auto-retry completed, checking final completeness');
              
              // Final completeness check
              const finalDiagnostics = getTruncationDiagnostics(response.text);
              const finalCompletenessCheck = isResponseComplete(
                response.text,
                finalDiagnostics,
                financialQueryType,
                queryText
              );
              
              // Update our references to use the latest response data
              completenessCheck.isComplete = finalCompletenessCheck.isComplete;
              completenessCheck.reasons = finalCompletenessCheck.reasons;
              completenessCheck.financialAnalysis = finalCompletenessCheck.financialAnalysis;
              
              console.log(`Second auto-retry result - Complete: ${finalCompletenessCheck.isComplete}`);
            } catch (secondRetryError) {
              console.error('Second auto-retry failed:', secondRetryError);
              // Continue with previous response if second retry fails
            }
          } else {
            // Update references with first retry results
            completenessCheck.isComplete = newCompletenessCheck.isComplete;
            completenessCheck.reasons = newCompletenessCheck.reasons;
            completenessCheck.financialAnalysis = newCompletenessCheck.financialAnalysis;
            
            console.log(`Auto-retry result - Complete: ${newCompletenessCheck.isComplete}`);
          }
        } catch (retryError) {
          console.error('Auto-retry failed:', retryError);
          // Continue with original response if retry fails
        }
      }
      
      // Format the bot message
      const botMessage = formatBotMessage(response, regulatoryContext, reasoning, isUsingFallback);
      
      // If not complete after retry attempts, mark as truncated
      if (!completenessCheck.isComplete) {
        console.log('Incomplete response detected:', {
          reasons: completenessCheck.reasons,
          financialAnalysisMissingElements: completenessCheck.financialAnalysis.missingElements
        });
        
        botMessage.isTruncated = true;
      }
      
      setMessages([...processedMessages, botMessage]);
      console.log('Response delivered successfully');
      
      if (botMessage.isTruncated) {
        console.log('Response appears to be truncated, showing retry option');
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
