
import { useState } from 'react';
import { Message } from '../ChatMessage';
import { grokService } from '@/services/grokService';
import { safelyExtractText } from '@/services/utils/responseUtils';
import { enhancedContextService } from '@/services/regulatory/context/enhancedContextService';

export const useResponseHandling = (
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>,
  retryLastQuery: () => void,
  isGrokApiKeySet: boolean
) => {
  const [isValidating, setIsValidating] = useState(false);

  const handleApiResponse = async (
    query: string,
    responseParams: any,
    regulatoryContext: string,
    reasoning: string,
    financialQueryType: string,
    updatedMessages: Message[],
    batchInfo?: { batchNumber: number, isContinuing: boolean },
    enhancedContext?: any // Added enhanced context parameter
  ) => {
    try {
      console.log('Generating response with enhanced validation...');
      
      // Generate the response
      const response = await grokService.generateResponse({
        ...responseParams,
        prompt: query,
        regulatoryContext
      });

      const responseText = safelyExtractText(response);
      
      if (!responseText) {
        throw new Error('No response text generated');
      }

      // Perform enhanced validation if enhanced context is available
      let validationResult = null;
      if (enhancedContext) {
        setIsValidating(true);
        try {
          validationResult = await enhancedContextService.validateResponseAgainstEnhancedContext(
            responseText,
            query,
            enhancedContext
          );
          console.log('Response validation completed:', validationResult);
        } catch (validationError) {
          console.error('Error during response validation:', validationError);
        } finally {
          setIsValidating(false);
        }
      }

      // Create the assistant message with validation metadata
      const assistantMessage: Message = {
        id: Date.now().toString(),
        content: responseText,
        isUser: false,
        timestamp: new Date(),
        metadata: {
          financialQueryType,
          reasoning,
          processingTime: 0, // Default value since response structure may not have this
          model: 'grok-4-0709', // Default model
          temperature: 0.5, // Default temperature
          maxTokens: 15000, // Default max tokens
          isTruncated: false, // Default to false, will be updated if needed
          ...(validationResult && {
            validation: {
              isValid: validationResult.isValid,
              vettingConsistency: validationResult.vettingConsistency,
              guidanceConsistency: validationResult.guidanceConsistency,
              validationNotes: validationResult.validationNotes,
              confidence: validationResult.confidence
            }
          }),
          ...(enhancedContext?.vettingInfo?.isRequired && {
            vettingRequired: true,
            vettingCategory: enhancedContext.vettingInfo.headlineCategory
          }),
          ...(enhancedContext?.guidanceValidation?.hasRelevantGuidance && {
            relevantGuidance: enhancedContext.guidanceValidation.matches.length,
            guidanceTypes: enhancedContext.guidanceValidation.matches.map((m: any) => m.type)
          })
        }
      };

      // Check if response has truncation indicators
      const isTruncated = responseText.includes('[NOTE: Response has been truncated') ||
                         responseText.includes('...') ||
                         (response.metadata && 'responseWasTruncated' in response.metadata && response.metadata.responseWasTruncated);

      if (isTruncated && assistantMessage.metadata) {
        assistantMessage.metadata.isTruncated = true;
      }

      setMessages([...updatedMessages, assistantMessage]);
      
      return {
        success: true,
        isTruncated: isTruncated,
        validationResult
      };
    } catch (error) {
      console.error('Error in enhanced response handling:', error);
      
      const errorMessage: Message = {
        id: Date.now().toString(),
        content: `I encountered an error while processing your request: ${error instanceof Error ? error.message : 'Unknown error'}`,
        isUser: false,
        timestamp: new Date(),
        metadata: {
          isError: true,
          financialQueryType,
          reasoning: 'Error occurred during processing'
        }
      };

      setMessages([...updatedMessages, errorMessage]);
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  };

  return {
    handleApiResponse,
    isValidating
  };
};
