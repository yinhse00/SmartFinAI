
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
  
  // First check API availability to fail fast
  const isApiAvailable = await checkApiAvailability(apiKey).catch(() => false);
  if (!isApiAvailable) {
    console.error("Grok API is unreachable - all endpoints appear to be down");
    throw new Error("Grok API is unreachable");
  }
  
  // Apply environment consistency parameters
  requestBody = {
    ...requestBody,
    environmentConsistency: true,
    envSignature: 'unified-env-2.0',
    unifiedProcessing: true
  };
  
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
  console.log("Environment signature:", requestBody.envSignature);
  
  try {
    // First try using the local proxy if available
    try {
      // Add timestamp to track response time
      const startTime = Date.now();
      const data = await attemptProxyRequest(requestBody, apiKey);
      const responseTime = Date.now() - startTime;
      console.log(`Financial expert API response received successfully via proxy (${responseTime}ms)`);
      return data;
    } catch (proxyError) {
      console.warn("Proxy request failed:", proxyError);
      // Continue with direct requests
    }
    
    // Attempt direct API calls with retries
    const startTime = Date.now();
    const data = await executeWithRetry(async () => {
      return await attemptDirectRequest(requestBody, apiKey);
    });
    
    const responseTime = Date.now() - startTime;
    console.log(`Financial expert API response received successfully via direct call (${responseTime}ms)`);
    return data;
  } catch (error) {
    console.error("Financial expert API call failed:", error);
    throw error;
  }
};
