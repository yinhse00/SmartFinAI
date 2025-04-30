
/**
 * Enhanced API request processing logic with automatic endpoint selection
 */
import { getGrokApiKey, selectLeastUsedKey, selectBestPerformingKey } from '../../../apiKeyService';
import { attemptProxyRequest, attemptDirectRequest, getOptimalEndpoint } from './endpointManager';
import { executeWithRetry } from './retryHandler';
import { isRetryAttempt } from './requestHelper';
import { prepareRequestParameters } from './queryParameterBuilder';

// Store the last known good endpoint configuration to avoid repeated checks
let lastKnownGoodEndpoint: {
  type: 'proxy' | 'direct' | 'none';
  endpoint?: string;
  timestamp: number;
} = {
  type: 'none',
  timestamp: 0
};

/**
 * Process API request with smart endpoint selection and fallback mechanisms
 */
export const processApiRequest = async (
  requestBody: any, 
  providedApiKey?: string
): Promise<any> => {
  // Find user message to check for retry attempts
  const userMessage = requestBody.messages?.find((msg: any) => msg.role === 'user');
  
  // Check if this is a retry attempt
  const isRetryRequest = isRetryAttempt(userMessage?.content);
  
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
  
  // Only check for a new endpoint if we don't have a recent one or this is a retry
  const ONE_MINUTE = 60000;
  if (!lastKnownGoodEndpoint.endpoint || 
      Date.now() - lastKnownGoodEndpoint.timestamp > ONE_MINUTE ||
      isRetryRequest) {
    
    console.log("Checking for optimal endpoint...");
    const endpointInfo = await getOptimalEndpoint(apiKey);
    
    if (endpointInfo.isAvailable) {
      lastKnownGoodEndpoint = {
        type: endpointInfo.endpointType,
        endpoint: endpointInfo.endpoint,
        timestamp: Date.now()
      };
      console.log(`Using ${endpointInfo.endpointType} endpoint: ${endpointInfo.endpoint}`);
    } else {
      console.warn("No working endpoints found, will attempt default endpoints anyway");
      // Reset last known endpoint to force a future check
      lastKnownGoodEndpoint = {
        type: 'none',
        timestamp: 0
      };
    }
  }
  
  try {
    // If we have a known working proxy endpoint, try it first
    if (lastKnownGoodEndpoint.type === 'proxy') {
      try {
        const data = await attemptProxyRequest(requestBody, apiKey);
        console.log("Financial expert API response received successfully via proxy");
        return data;
      } catch (proxyError) {
        console.warn("Proxy request failed despite endpoint check:", proxyError);
        // Reset the last known endpoint and continue with direct requests
        lastKnownGoodEndpoint = {
          type: 'none',
          timestamp: 0
        };
      }
    }
    
    // Attempt direct API calls with retries
    const data = await executeWithRetry(async () => {
      return await attemptDirectRequest(requestBody, apiKey);
    });
    
    console.log("Financial expert API response received successfully via direct call");
    return data;
  } catch (error) {
    console.error("Financial expert API call failed completely:", error);
    throw error;
  }
};
