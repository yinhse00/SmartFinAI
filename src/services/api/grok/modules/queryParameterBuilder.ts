
/**
 * Prepares and enhances query parameters for Grok API requests
 */
import { tokenManagementService } from '../../../response/modules/tokenManagementService';
import { extractPromptText, isRetryAttempt } from './requestHelper';

/**
 * Prepare and enhance request parameters based on query context
 */
export const prepareRequestParameters = (requestBody: any): { 
  effectiveTokenLimit: number,
  isRetryRequest: boolean 
} => {
  // Find user message to check for retry attempts
  const userMessage = requestBody.messages.find((msg: any) => msg.role === 'user');
  
  // Check if this is a retry attempt
  const isRetryRequest = isRetryAttempt(userMessage);

  // Extract prompt text for token management
  const promptText = extractPromptText(userMessage);
  
  // Determine token limit based on query context
  const effectiveTokenLimit = tokenManagementService.getTokenLimit({
    queryType: 'general',
    isRetryAttempt: isRetryRequest,
    prompt: promptText
  });

  return { effectiveTokenLimit, isRetryRequest };
};
