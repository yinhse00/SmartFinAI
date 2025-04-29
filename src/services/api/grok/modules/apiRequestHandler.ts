
/**
 * Core API request handler
 */
import { getGrokApiKey, selectLeastUsedKey, selectBestPerformingKey } from '../../../apiKeyService';
import { tokenManagementService } from '../../../response/modules/tokenManagementService';
import { isRetryAttempt, extractPromptText } from './requestHelper';
import { attemptProxyRequest, attemptDirectRequest } from './endpointManager';
import { executeWithRetry } from './retryHandler';
import { trackApiResponseMetrics } from './responseTracker';
import { offlineResponseGenerator } from '../offlineResponseGenerator';

/**
 * Core function to handle Grok API requests with comprehensive error handling
 */
export const handleChatCompletions = async (requestBody: any, providedApiKey?: string): Promise<any> => {
  // Find user message to check for retry attempts
  const userMessage = requestBody.messages.find((msg: any) => msg.role === 'user');
  
  // Check if this is a retry attempt
  const isRetryRequest = isRetryAttempt(userMessage);
  
  // Use provided key, or select the best key based on context and load balancing
  const apiKey = providedApiKey || 
               (isRetryRequest ? selectLeastUsedKey() : selectBestPerformingKey()) || 
               getGrokApiKey();
  
  if (!apiKey) {
    console.error("No API key provided for financial expert access");
    throw new Error("No API key provided for financial expert access");
  }
  
  if (!apiKey.startsWith('xai-')) {
    console.error("Invalid financial expert API key format");
    throw new Error("Invalid financial expert API key format");
  }
  
  // Ensure token limits are properly applied
  if (!requestBody.max_tokens) {
    // Extract prompt text for token management
    const promptText = extractPromptText(userMessage);
    
    const effectiveTokenLimit = tokenManagementService.getTokenLimit({
      queryType: 'general',
      isRetryAttempt: isRetryRequest,
      prompt: promptText
    });
    
    console.log(`No token limit specified, using configured limit: ${effectiveTokenLimit}`);
    requestBody.max_tokens = effectiveTokenLimit;
  }
  
  console.log("Making API call to Grok financial expert API");
  console.log("Request model:", requestBody.model);
  console.log("Temperature:", requestBody.temperature);
  console.log("Max tokens:", requestBody.max_tokens);
  console.log("Using API Key:", apiKey.substring(0, 8) + "***");
  console.log("Is retry attempt:", isRetryRequest ? "Yes" : "No");
  
  try {
    // First try using the local proxy if available
    try {
      const data = await attemptProxyRequest(requestBody, apiKey);
      console.log("Financial expert API response received successfully via proxy");
      
      // Track token usage and response quality
      trackApiResponseMetrics(apiKey, data);
      
      return data;
    } catch (proxyError) {
      console.warn("Proxy request failed:", proxyError);
      // Continue with direct requests
    }
    
    // Attempt direct API calls with retries
    const data = await executeWithRetry(async () => {
      return await attemptDirectRequest(requestBody, apiKey);
    });
    
    console.log("Financial expert API response received successfully via direct call");
    
    // Track token usage and response quality
    trackApiResponseMetrics(apiKey, data);
    
    return data;
  } catch (error) {
    console.error("Financial expert API call failed:", error);
    
    // Create prompt text for offline response
    let promptText = extractPromptText(userMessage);
    
    return offlineResponseGenerator.generateOfflineResponseFormat(promptText, error);
  }
};
