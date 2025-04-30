
/**
 * Core API request processing logic
 */
import { getGrokApiKey, selectLeastUsedKey, selectBestPerformingKey } from '../../../apiKeyService';
import { attemptProxyRequest, attemptDirectRequest, checkApiAvailability } from './endpointManager';
import { executeWithRetry } from './retryHandler';
import { isRetryAttempt } from './requestHelper';
import { prepareRequestParameters } from './queryParameterBuilder';

/**
 * Process API request with optimized parameters
 */
export const processApiRequest = async (
  requestBody: any, 
  providedApiKey?: string
): Promise<any> => {
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
  
  // First check API availability without throwing errors
  let isApiAvailable = false;
  try {
    isApiAvailable = await checkApiAvailability(apiKey);
  } catch (availabilityError) {
    console.warn("API availability check failed:", availabilityError);
    // Continue anyway - we'll try the actual request
  }
  
  if (!isApiAvailable) {
    console.warn("API availability check indicates API may be unreachable, but we'll still try the request");
  }
  
  // Ensure token limits are properly applied
  if (!requestBody.max_tokens) {
    const { effectiveTokenLimit } = prepareRequestParameters(requestBody);
    
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
    // Always try local proxy first (most likely to work)
    try {
      console.log("Attempting API call via local proxy");
      const data = await attemptProxyRequest(requestBody, apiKey);
      console.log("Financial expert API response received successfully via proxy");
      return data;
    } catch (proxyError) {
      console.warn("Proxy request failed:", proxyError);
      // Only try direct requests if proxy specifically failed (not just unreachable)
      if (proxyError instanceof Error && 
          (proxyError.message.includes("404") || 
           proxyError.message.includes("not found") ||
           proxyError.message.includes("invalid endpoint"))) {
        console.log("Proxy endpoint not configured properly, attempting direct calls");
      } else {
        console.error("Proxy error indicates API may be unreachable:", proxyError);
        throw proxyError; // Don't try direct calls if proxy failed for other reasons
      }
    }
    
    // Only reach here if proxy is not configured
    // Attempt direct API calls with retries
    const data = await executeWithRetry(async () => {
      return await attemptDirectRequest(requestBody, apiKey);
    });
    
    console.log("Financial expert API response received successfully via direct call");
    return data;
  } catch (error) {
    console.error("Financial expert API call failed:", error);
    throw error;
  }
};
