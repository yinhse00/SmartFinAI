
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
  
  // Smart model selection strategy for improved performance
  // Use grok-3-mini-beta for ALL internal processing to save costs and time
  const isUserFacingQuery = !requestBody.metadata?.internalProcessing;
  const isExternalProcessing = requestBody.metadata?.processingStage === 'main' || 
                              requestBody.metadata?.processingStage === undefined;
  
  // Only use full model for final user-facing content
  if (isUserFacingQuery && isExternalProcessing) {
    console.log("Using grok-3-beta for quality user-facing response");
    requestBody.model = "grok-3-beta";
  } else {
    // Use mini model for ALL internal processing to save costs and improve performance
    console.log("Using grok-3-mini-beta for processing");
    requestBody.model = "grok-3-mini-beta";
  }
  
  // Prepare request parameters with optimized token limits
  const { effectiveTokenLimit } = prepareRequestParameters(requestBody);
  
  // Don't override token limit if specified, but ensure it's reasonable
  if (!requestBody.max_tokens) {
    console.log(`Using default token limit: ${effectiveTokenLimit}`);
    requestBody.max_tokens = effectiveTokenLimit;
  }
  
  // Don't override temperature if explicitly set
  if (requestBody.temperature === undefined && !isUserFacingQuery) {
    requestBody.temperature = 0.3;
  } else if (requestBody.temperature === undefined) {
    // For user-facing queries, use balanced temperature
    requestBody.temperature = 0.5;
  }
  
  console.log("Making API call to Grok financial expert API");
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
    
    // Use appropriate number of retries based on query importance
    const maxRetries = isUserFacingQuery ? 2 : 1;
    
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
    
    return data;
  } catch (error) {
    console.error("Financial expert API call failed:", error);
    throw error;
  }
};
