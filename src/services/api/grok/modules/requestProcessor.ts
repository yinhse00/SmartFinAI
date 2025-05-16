/**
 * Core API request processing logic - Optimized for faster responses
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

/**
 * Process API request with optimized parameters for faster responses
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
  
  // Check if this is a complex query
  const isComplexQuery = typeof userMessage?.content === 'string' && (
    userMessage.content.toLowerCase().includes('rights issue') ||
    userMessage.content.toLowerCase().includes('timetable')
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
  
  // Optimize token limits for faster responses
  if (!requestBody.max_tokens) {
    // Use much smaller token limits for faster responses
    const { effectiveTokenLimit } = prepareRequestParameters(requestBody);
    const fastResponseLimit = Math.min(1000, effectiveTokenLimit / 2);
    console.log(`Using optimized token limit: ${fastResponseLimit}`);
    requestBody.max_tokens = fastResponseLimit;
  } else if (requestBody.max_tokens > 2000 && !isComplexQuery) {
    // Cap token limit for non-complex queries
    console.log(`Reducing token limit from ${requestBody.max_tokens} to 2000 for faster response`);
    requestBody.max_tokens = 2000;
  }
  
  // Always use mini model for faster responses unless specifically overridden
  if (!requestBody.model || 
      (requestBody.model === 'grok-3-beta' && 
       !isComplexQuery && 
       !requestBody.metadata?.specializedQuery)) {
    console.log("Using grok-3-mini-beta for faster response");
    requestBody.model = "grok-3-mini-beta";
  }
  
  // Use lower temperature for more deterministic, faster responses
  if (requestBody.temperature > 0.2) {
    console.log(`Reducing temperature from ${requestBody.temperature} to 0.1 for faster response`);
    requestBody.temperature = 0.1;
  }
  
  console.log("Making optimized API call to Grok financial expert API");
  console.log("Request model:", requestBody.model);
  console.log("Temperature:", requestBody.temperature);
  console.log("Max tokens:", requestBody.max_tokens);
  
  // Add metadata to request
  if (!requestBody.metadata) {
    requestBody.metadata = {};
  }
  requestBody.metadata.conversationId = conversationId;
  requestBody.metadata.isBatchRequest = isBatchRequest;
  requestBody.metadata.batchNumber = batchNumber;
  requestBody.metadata.isComplexQuery = isComplexQuery;
  requestBody.metadata.optimizedForSpeed = true;
  
  try {
    // First try proxy for faster response
    try {
      const data = await attemptProxyRequest(requestBody, apiKey);
      // Reset complex query attempts on success
      if (isComplexQuery) {
        complexQueryAttempts.delete(querySignature);
      }
      return data;
    } catch (proxyError) {
      // Continue with direct requests
    }
    
    // Use minimal retries for faster response
    const maxRetries = isComplexQuery ? 1 : 0;
    
    // Attempt direct call with minimal retries
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
    
    return data;
  } catch (error) {
    console.error("Financial expert API call failed:", error);
    throw error;
  }
};
