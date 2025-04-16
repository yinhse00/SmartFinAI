
import { useToast } from '@/hooks/use-toast';
import { grokService } from '@/services/grokService';
import { getTruncationDiagnostics } from '@/utils/truncation';
import { Message } from '../ChatMessage';
import { useResponseFormatter } from './useResponseFormatter';
import { useTruncationDetection, isTradingArrangementRelated } from './useTruncationDetection';
import { useErrorHandling } from './useErrorHandling';
import { isSimpleConversationalQuery } from '@/services/financial/expertiseDetection';

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
      
      // Determine if this is a simple conversational query
      const isSimpleQuery = isSimpleConversationalQuery(queryText);
      
      // First attempt with significantly increased token limits
      // Already using 3x from the calling function
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
      
      // For simple queries, skip extensive completeness checking
      let completenessCheck = { isComplete: true, reasons: [], financialAnalysis: { isComplete: true, missingElements: [] } };
      
      if (!isSimpleQuery) {
        // Do comprehensive completeness check for financial/regulatory queries
        completenessCheck = isResponseComplete(
          response.text, 
          diagnostics, 
          financialQueryType, 
          queryText
        );
      }

      // For simple queries, skip retries completely
      // For complex queries, implement aggressive retry strategy with up to 2 attempts
      let retryCount = 0;
      const maxRetries = isSimpleQuery ? 0 : 2; // No retries for simple queries
      
      while (retryCount < maxRetries && !completenessCheck.isComplete && !isUsingFallback && isGrokApiKeySet) {
        console.log(`Response appears incomplete (attempt ${retryCount + 1}/${maxRetries}), retrying with extreme token limit`);
        
        // Super aggressive token scaling for faster convergence to complete responses
        // Use multipliers of 6x and 10x to almost guarantee complete responses
        const tokenMultiplier = retryCount === 0 ? 6 : 10;
        const increasedTokens = Math.floor(responseParams.maxTokens * tokenMultiplier);
        
        // Aggressive temperature reduction for more reliable outputs
        const temperatureReduction = retryCount === 0 ? 0.5 : 0.2;
        const reducedTemperature = Math.max(0.01, responseParams.temperature * temperatureReduction);
        
        const enhancedParams = {
          ...responseParams,
          maxTokens: increasedTokens,
          temperature: reducedTemperature
        };
        
        console.log(`Retry #${retryCount + 1} with tokens: ${increasedTokens}, temperature: ${reducedTemperature}`);
        
        try {
          // Special handling for financial comparison queries to ensure completeness
          if ((financialQueryType === 'rights_issue' || 
              financialQueryType.includes('financial') ||
              queryText.toLowerCase().includes('difference')) && 
              retryCount === maxRetries - 1) {
            
            // For the final retry of a comparison query, explicitly request conclusion
            enhancedParams.prompt = enhancedParams.prompt + 
              " Make sure to include a complete conclusion section that summarizes all key differences and provide a full analysis without any truncation. Be comprehensive and complete.";
          }
          
          // Special handling for timetable queries on final retry
          if ((queryText.toLowerCase().includes('timetable') || 
               queryText.toLowerCase().includes('schedule')) && 
              retryCount === maxRetries - 1) {
            
            enhancedParams.prompt = enhancedParams.prompt + 
              " Ensure the response contains all dates, trading periods, and a complete timetable without truncation. Be thorough in the response and include all details.";
          }
          
          // Execute retry with higher token limit
          response = await grokService.generateResponse(enhancedParams);
          console.log(`Retry #${retryCount + 1} completed, checking completeness`);
          
          // Re-check completeness
          const newDiagnostics = getTruncationDiagnostics(response.text);
          const newCompletenessCheck = isResponseComplete(
            response.text,
            newDiagnostics,
            financialQueryType,
            queryText
          );
          
          // Update completeness check results
          completenessCheck.isComplete = newCompletenessCheck.isComplete;
          completenessCheck.reasons = newCompletenessCheck.reasons;
          completenessCheck.financialAnalysis = newCompletenessCheck.financialAnalysis;
          
          console.log(`Retry #${retryCount + 1} result - Complete: ${newCompletenessCheck.isComplete}`);
          
          // If complete, break out of retry loop immediately to save time
          if (newCompletenessCheck.isComplete) {
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
