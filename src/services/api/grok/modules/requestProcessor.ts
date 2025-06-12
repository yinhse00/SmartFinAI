
/**
 * Core API request processing logic - Optimized for quality responses
 */
import { 
  getGrokApiKey, 
  selectLeastUsedKey, 
  selectBestPerformingKey,
  getBatchContinuationKey
} from '../../../apiKeyService';
import { attemptProxyRequest, attemptDirectRequest, checkApiAvailability, forceResetAllCircuitBreakers } from './endpointManager';
import { executeWithRetry } from './retryHandler';
import { isRetryAttempt, isBatchContinuation } from './requestHelper';
import { prepareRequestParameters } from './queryParameterBuilder';

// Keep track of complex query attempts to avoid infinite retry loops
const complexQueryAttempts = new Map<string, number>();

// Response cache for similar queries
const responseCache = new Map<string, {
  response: any,
  timestamp: number,
  conversationId: string
}>();

// Cache expiration time (10 minutes)
const CACHE_EXPIRATION_MS = 10 * 60 * 1000;

// Generate cache key from request
const generateCacheKey = (requestBody: any): string => {
  const userMessage = requestBody.messages?.find((msg: any) => msg.role === 'user');
  const content = typeof userMessage?.content === 'string' ? 
    userMessage.content : JSON.stringify(userMessage?.content);
  
  // Include model and temperature in cache key
  const model = requestBody.model || 'default';
  const temperature = requestBody.temperature || 'default';
  
  // Check if is an internal processing request (exclude from cache)
  if (requestBody.metadata?.internalProcessing) {
    return `no-cache-${Date.now()}-${Math.random()}`;
  }
  
  // Check if this is a follow-up request with bypass flag or unique ID
  if (requestBody.metadata?.bypassCache || requestBody.metadata?.followUpId) {
    console.log('Bypassing cache for follow-up request:', requestBody.metadata?.followUpId);
    return `no-cache-followup-${requestBody.metadata?.followUpId || Date.now()}-${Math.random()}`;
  }
  
  return `${content.substring(0, 100)}-${model}-${temperature}`;
};

// Check cache for similar requests
const checkCache = (requestBody: any) => {
  const cacheKey = generateCacheKey(requestBody);
  
  // If cache key indicates no-cache, skip
  if (cacheKey.startsWith('no-cache')) {
    console.log('Cache bypassed due to no-cache key:', cacheKey.substring(0, 50));
    return null;
  }
  
  const cached = responseCache.get(cacheKey);
  
  if (cached) {
    const now = Date.now();
    // Check if cache is still valid
    if (now - cached.timestamp < CACHE_EXPIRATION_MS) {
      console.log('Cache hit! Using cached response');
      return {
        ...cached.response,
        metadata: {
          ...cached.response.metadata,
          cacheHit: true,
          cacheAge: Math.round((now - cached.timestamp) / 1000)
        }
      };
    } else {
      // Clear expired cache
      responseCache.delete(cacheKey);
    }
  }
  
  return null;
};

// Update cache with new response
const updateCache = (requestBody: any, response: any) => {
  // Only cache successful responses
  if (!response || !response.choices || response.error) {
    return;
  }
  
  // Don't cache internal processing responses
  if (requestBody.metadata?.internalProcessing) {
    return;
  }
  
  // Don't cache follow-up responses with bypass flag
  if (requestBody.metadata?.bypassCache || requestBody.metadata?.followUpId) {
    console.log('Skipping cache storage for follow-up response');
    return;
  }
  
  const cacheKey = generateCacheKey(requestBody);
  responseCache.set(cacheKey, {
    response,
    timestamp: Date.now(),
    conversationId: requestBody.metadata?.conversationId || 'unknown'
  });
  
  // Limit cache size to 50 entries
  if (responseCache.size > 50) {
    // Delete oldest cache entry
    const oldestKey = Array.from(responseCache.keys())[0];
    responseCache.delete(oldestKey);
  }
};

/**
 * Process API request with parameters optimized for high-quality responses
 */
export const processApiRequest = async (
  requestBody: any, 
  providedApiKey?: string
): Promise<any> => {
  // Extract key information from request
  const userMessage = requestBody.messages?.find((msg: any) => msg.role === 'user');
  const isRetryRequest = isRetryAttempt(userMessage);
  const isBatchRequest = isBatchContinuation(userMessage);
  const conversationId = requestBody.conversationId || 'unknown';
  let batchNumber = 1;
  
  if (isBatchRequest && userMessage && typeof userMessage.content === 'string') {
    const match = userMessage.content.match(/\[CONTINUATION_PART_(\d+)\]/);
    if (match && match[1]) {
      batchNumber = parseInt(match[1], 10);
    }
  }
  
  // Create query signature for tracking
  const querySignature = typeof userMessage?.content === 'string' ? 
    userMessage.content.substring(0, 100) : 'unknown-query';
  
  // Check if this is a complex query for model selection purposes
  const isComplexQuery = typeof userMessage?.content === 'string' && (
    userMessage.content.toLowerCase().includes('rights issue') ||
    userMessage.content.toLowerCase().includes('timetable') ||
    userMessage.content.toLowerCase().includes('connected transaction') ||
    userMessage.content.toLowerCase().includes('takeovers code') ||
    userMessage.content.length > 200
  );
  
  // Track complex query attempts
  if (isComplexQuery) {
    const currentAttempts = complexQueryAttempts.get(querySignature) || 0;
    if (currentAttempts >= 2) {
      console.log("Forcing circuit breaker reset after multiple attempts with complex query");
      forceResetAllCircuitBreakers();
    }
    complexQueryAttempts.set(querySignature, currentAttempts + 1);
  }
  
  // Select appropriate API key
  let apiKey = providedApiKey;
  if (!apiKey) {
    if (isBatchRequest) {
      apiKey = getBatchContinuationKey(conversationId, batchNumber);
    } else if (isRetryRequest) {
      apiKey = selectLeastUsedKey();
    } else {
      apiKey = selectBestPerformingKey();
    }
    
    if (!apiKey) {
      apiKey = getGrokApiKey({
        isBatchRequest,
        batchNumber,
        conversationId
      });
    }
  }
  
  // Validate API key
  if (!apiKey) {
    throw new Error("No API key provided for financial expert access");
  }
  
  if (!apiKey.startsWith('xai-')) {
    throw new Error("Invalid financial expert API key format");
  }
  
  // Fast API availability check
  const isApiAvailable = await checkApiAvailability(apiKey).catch(() => false);
  if (!isApiAvailable) {
    throw new Error("Grok API is unreachable");
  }
  
  // Check cache for similar requests (unless it's a retry, batch, or follow-up with bypass)
  if (!isRetryRequest && !isBatchRequest) {
    const cachedResponse = checkCache(requestBody);
    if (cachedResponse) {
      return cachedResponse;
    }
  }
  
  // OPTIMIZATION: Always use full model for all queries to maintain quality
  requestBody.model = "grok-3-beta";
  
  // Prepare request parameters without aggressive token capping
  const { effectiveTokenLimit } = prepareRequestParameters(requestBody);
  
  // Don't override token limit if specified, but ensure it's reasonable
  if (!requestBody.max_tokens) {
    console.log(`Using default token limit: ${effectiveTokenLimit}`);
    requestBody.max_tokens = effectiveTokenLimit;
  }
  
  // Don't override temperature if explicitly set
  if (requestBody.temperature === undefined) {
    // Use balanced temperature
    requestBody.temperature = 0.5;
  }
  
  console.log("Making API call to Grok financial expert API");
  console.log("Request model:", requestBody.model);
  console.log("Temperature:", requestBody.temperature);
  console.log("Max tokens:", requestBody.max_tokens);
  console.log("Follow-up ID:", requestBody.metadata?.followUpId || 'none');
  console.log("Cache bypass:", requestBody.metadata?.bypassCache || false);
  
  // Add metadata to request
  if (!requestBody.metadata) {
    requestBody.metadata = {};
  }
  requestBody.metadata.conversationId = conversationId;
  requestBody.metadata.isBatchRequest = isBatchRequest;
  requestBody.metadata.batchNumber = batchNumber;
  requestBody.metadata.isComplexQuery = isComplexQuery;
  
  try {
    // First try proxy for faster response
    try {
      const data = await attemptProxyRequest(requestBody, apiKey);
      // Reset complex query attempts on success
      if (isComplexQuery) {
        complexQueryAttempts.delete(querySignature);
      }
      
      // Update cache with response
      updateCache(requestBody, data);
      
      return data;
    } catch (proxyError) {
      // Continue with direct requests
    }
    
    // Use appropriate number of retries based on query importance
    const maxRetries = 2;
    
    // Attempt direct call with appropriate retries
    const data = await executeWithRetry(
      async () => {
        return await attemptDirectRequest(requestBody, apiKey);
      }, 
      maxRetries
    );
    
    // Reset complex query attempts on success
    if (isComplexQuery) {
      complexQueryAttempts.delete(querySignature);
    }
    
    // Update cache with response
    updateCache(requestBody, data);
    
    return data;
  } catch (error) {
    console.error("Financial expert API call failed:", error);
    throw error;
  }
};
