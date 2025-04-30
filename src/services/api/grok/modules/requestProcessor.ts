
/**
 * Core API request processing logic
 */
import { getGrokApiKey, selectLeastUsedKey, selectBestPerformingKey, getFreshGrokApiKey } from '../../../apiKeyService';
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
  
  // Check if this is a continuation request for batched responses
  const isContinuationRequest = userMessage && typeof userMessage.content === 'string' && 
                              userMessage.content.includes('[CONTINUATION_PART_');
  
  // Use provided key or select the best key based on context and request type
  // For continuations, always use getFreshGrokApiKey to select a less-used API key
  let apiKey;
  
  if (providedApiKey) {
    apiKey = providedApiKey;
  } else if (isContinuationRequest) {
    // For continuations, use a fresh key for better throughput
    apiKey = getFreshGrokApiKey();
    console.log("Using fresh API key for continuation request");
  } else if (isRetryRequest) {
    // For retries, use least used key to avoid rate limits
    apiKey = selectLeastUsedKey();
    console.log("Using least used API key for retry request");
  } else {
    // For normal requests, use best performing key based on quality metrics
    apiKey = selectBestPerformingKey();
    console.log("Using best performing API key for standard request");
  }
  
  // Fallback to default key if selection failed
  if (!apiKey) {
    console.warn("Key selection failed, using default API key");
    apiKey = getGrokApiKey();
  }
  
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
  console.log("Is continuation request:", isContinuationRequest ? "Yes" : "No");
  
  try {
    // Always try local proxy first (most likely to work)
    try {
      console.log("Attempting API call via local proxy");
      const data = await attemptProxyRequest(requestBody, apiKey);
      console.log("Financial expert API response received successfully via proxy");
      return data;
    } catch (proxyError) {
      console.warn("Proxy request failed:", proxyError);
      
      // Check if this is a network error (connectivity or CORS issue)
      const isNetworkError = proxyError instanceof Error && 
          (proxyError.message.includes('Failed to fetch') || 
           proxyError.message.includes('NetworkError') ||
           proxyError.message.includes('CORS') ||
           proxyError.message.includes('cross-origin') ||
           proxyError.message.includes('fetch'));
      
      if (isNetworkError) {
        console.error("Network error (possibly CORS-related) when contacting proxy:", proxyError);
        // Try direct calls as a last resort, but warn that they're likely to fail too
        console.warn("Attempting direct calls as fallback, but these may also fail due to CORS restrictions");
      } else if (proxyError instanceof Error && 
          (proxyError.message.includes("404") || 
           proxyError.message.includes("not found") ||
           proxyError.message.includes("invalid endpoint"))) {
        console.log("Proxy endpoint not configured properly, attempting direct calls");
      } else {
        // For other proxy errors, we might still try direct calls
        console.error("Proxy error:", proxyError);
        console.log("Attempting direct calls as fallback");
      }
      
      // Track proxy failure for diagnostics
      try {
        localStorage.setItem('lastProxyError', JSON.stringify({
          timestamp: Date.now(),
          message: proxyError instanceof Error ? proxyError.message : String(proxyError),
          type: proxyError instanceof Error ? proxyError.name : typeof proxyError
        }));
      } catch (e) {
        // Ignore storage errors
      }
    }
    
    // Only reach here if proxy failed - attempt direct API calls with retries
    try {
      const data = await executeWithRetry(async () => {
        return await attemptDirectRequest(requestBody, apiKey);
      }, 3);
      
      console.log("Financial expert API response received successfully via direct call");
      return data;
    } catch (directError) {
      console.error("Direct API call failed:", directError);
      
      // Enhance error message for CORS-related issues
      if (directError instanceof Error && 
          (directError.message.includes('Failed to fetch') || 
           directError.message.includes('CORS') ||
           directError.message.includes('cross-origin'))) {
        throw new Error(
          "Cannot access API due to browser security restrictions (CORS). " +
          "This is a common issue when calling APIs directly from a browser. " +
          "Please ensure you have a properly configured server-side proxy."
        );
      }
      
      throw directError;
    }
  } catch (error) {
    console.error("All API call attempts failed:", error);
    throw error;
  }
};
