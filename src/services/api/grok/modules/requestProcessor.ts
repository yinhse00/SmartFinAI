
/**
 * Core API request processing logic
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
 * Process API request with optimized parameters
 */
export const processApiRequest = async (
  requestBody: any, 
  providedApiKey?: string
): Promise<any> => {
  // Find user message to check for retry attempts and batch continuations
  const userMessage = requestBody.messages?.find((msg: any) => msg.role === 'user');
  
  // Check if this is a retry attempt or batch continuation
  const isRetryRequest = isRetryAttempt(userMessage);
  const isBatchRequest = isBatchContinuation(userMessage);
  const conversationId = requestBody.conversationId || 'unknown';
  let batchNumber = 1;
  
  // Extract batch number if present
  if (isBatchRequest && userMessage && typeof userMessage.content === 'string') {
    const match = userMessage.content.match(/\[CONTINUATION_PART_(\d+)\]/);
    if (match && match[1]) {
      batchNumber = parseInt(match[1], 10);
    }
  }
  
  // Create a query signature for tracking complex queries
  const querySignature = typeof userMessage?.content === 'string' ? 
    userMessage.content.substring(0, 100) : 'unknown-query';
  
  // Check if this is a complex query
  const isComplexQuery = typeof userMessage?.content === 'string' && (
    userMessage.content.toLowerCase().includes('rights issue') ||
    userMessage.content.toLowerCase().includes('whitewash') ||
    userMessage.content.toLowerCase().includes('timetable') ||
    userMessage.content.toLowerCase().includes('connected transaction') ||
    userMessage.content.toLowerCase().includes('substantial acquisition')
  );
  
  // If this is a complex query, check if we're hitting a retry limit
  if (isComplexQuery) {
    const currentAttempts = complexQueryAttempts.get(querySignature) || 0;
    
    if (currentAttempts > 0) {
      console.log(`Complex query "${querySignature}" - attempt ${currentAttempts + 1}`);
    }
    
    // If we've tried this complex query too many times, force reset all circuit breakers
    if (currentAttempts >= 2) {
      console.log("Forcing circuit breaker reset after multiple attempts with complex query");
      forceResetAllCircuitBreakers();
    }
    
    complexQueryAttempts.set(querySignature, currentAttempts + 1);
  }
  
  // Use provided key, or select the best key based on context and load balancing
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
  
  // Ensure token limits are properly applied
  if (!requestBody.max_tokens) {
    const { effectiveTokenLimit } = prepareRequestParameters(requestBody);
    
    console.log(`No token limit specified, using configured limit: ${effectiveTokenLimit}`);
    requestBody.max_tokens = effectiveTokenLimit;
  } else if (isBatchRequest && batchNumber > 1) {
    // For batch continuations, increase token limit to ensure we get complete responses
    const increasedTokenLimit = Math.min(30000, requestBody.max_tokens * 1.5);
    console.log(`Batch continuation detected (batch ${batchNumber}), increasing token limit from ${requestBody.max_tokens} to ${increasedTokenLimit}`);
    requestBody.max_tokens = increasedTokenLimit;
  }

  // For complex queries, always use higher token limits and lower temperature
  if (isComplexQuery) {
    // For complex financial queries, use maximum tokens available
    const complexQueryTokenLimit = Math.min(30000, requestBody.max_tokens * 2);
    console.log(`Complex financial query detected, increasing token limit to ${complexQueryTokenLimit}`);
    requestBody.max_tokens = complexQueryTokenLimit;
    
    // Use lower temperature for more deterministic results with complex queries
    if (requestBody.temperature > 0.15) {
      console.log(`Reducing temperature for complex query from ${requestBody.temperature} to 0.15`);
      requestBody.temperature = 0.15;
    }
  }
  
  // NEW: Set model based on processing stage
  // For initial query assessment, use grok-3-beta (more capable model)
  // For subsequent processing, use grok-3-mini-beta (faster, more efficient)
  const isPreliminaryAssessment = !isBatchRequest && !isRetryRequest && 
                                (requestBody.metadata?.processingStage === 'preliminary' ||
                                 requestBody.metadata?.isInitialAssessment === true);
  
  // Set model based on processing stage
  if (isPreliminaryAssessment) {
    console.log("Using grok-3-beta for preliminary question assessment");
    requestBody.model = "grok-3-beta";
  } else {
    console.log("Using grok-3-mini-beta for main response processing");
    requestBody.model = "grok-3-mini-beta";
  }
  
  console.log("Making API call to Grok financial expert API");
  console.log("Request model:", requestBody.model);
  console.log("Temperature:", requestBody.temperature);
  console.log("Max tokens:", requestBody.max_tokens);
  console.log("Using API Key:", apiKey.substring(0, 8) + "***");
  console.log("Is batch request:", isBatchRequest ? `Yes (part ${batchNumber})` : "No");
  console.log("Is retry attempt:", isRetryRequest ? "Yes" : "No");
  console.log("Is complex query:", isComplexQuery ? "Yes" : "No");
  console.log("Is preliminary assessment:", isPreliminaryAssessment ? "Yes" : "No");
  
  // Add conversation tracking metadata to help with key management
  if (!requestBody.metadata) {
    requestBody.metadata = {};
  }
  requestBody.metadata.conversationId = conversationId;
  requestBody.metadata.isBatchRequest = isBatchRequest;
  requestBody.metadata.batchNumber = batchNumber;
  requestBody.metadata.isComplexQuery = isComplexQuery;
  
  try {
    // First try using the local proxy if available
    try {
      const data = await attemptProxyRequest(requestBody, apiKey);
      console.log("Financial expert API response received successfully via proxy");
      
      // On success, reset complex query attempts
      if (isComplexQuery) {
        complexQueryAttempts.delete(querySignature);
      }
      
      return data;
    } catch (proxyError) {
      console.warn("Proxy request failed:", proxyError);
      // Continue with direct requests
    }
    
    // For complex queries, use more retries and longer timeouts
    const maxRetries = isComplexQuery ? 3 : 2;
    
    // Attempt direct API calls with retries
    const data = await executeWithRetry(
      async () => {
        return await attemptDirectRequest(requestBody, apiKey);
      }, 
      maxRetries
    );
    
    console.log("Financial expert API response received successfully via direct call");
    
    // On success, reset complex query attempts
    if (isComplexQuery) {
      complexQueryAttempts.delete(querySignature);
    }
    
    return data;
  } catch (error) {
    console.error("Financial expert API call failed:", error);
    throw error;
  }
};
