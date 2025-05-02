
/**
 * Helper functions for analyzing and processing API requests
 */

/**
 * Check if a request is a retry attempt
 */
export const isRetryAttempt = (userMessage: any): boolean => {
  if (!userMessage || typeof userMessage.content !== 'string') return false;
  return userMessage.content.includes('[RETRY_ATTEMPT');
};

/**
 * Check if a request is a batch continuation
 */
export const isBatchContinuation = (userMessage: any): boolean => {
  if (!userMessage || typeof userMessage.content !== 'string') return false;
  return userMessage.content.includes('[CONTINUATION_PART_');
};

/**
 * Extract batch number from a user message
 */
export const extractBatchNumber = (userMessage: any): number | null => {
  if (!userMessage || typeof userMessage.content !== 'string') return null;
  
  const match = userMessage.content.match(/\[CONTINUATION_PART_(\d+)\]/);
  if (match && match[1]) {
    return parseInt(match[1], 10);
  }
  
  return null;
};

/**
 * Extract conversation ID from request body or user message content
 */
export const extractConversationId = (requestBody: any): string => {
  if (requestBody.conversationId) {
    return requestBody.conversationId;
  }
  
  // Try to extract from user message content
  const userMessage = requestBody.messages?.find((msg: any) => msg.role === 'user');
  if (userMessage && typeof userMessage.content === 'string') {
    // Extract UUID-like strings that might be conversation IDs
    const uuidMatch = userMessage.content.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i);
    if (uuidMatch) {
      return uuidMatch[0];
    }
  }
  
  // Fallback to a timestamp-based ID
  return `convo-${Date.now()}`;
};

/**
 * Check if a request is likely to result in a large response
 */
export const isLikelyLargeResponse = (userMessage: any): boolean => {
  if (!userMessage || typeof userMessage.content !== 'string') return false;
  
  const content = userMessage.content.toLowerCase();
  
  // Check for keywords that typically result in large responses
  return (
    content.includes('timetable') ||
    content.includes('chapter 14a') ||
    content.includes('connected transaction') ||
    content.includes('explain in detail') ||
    content.includes('listing rules') ||
    content.includes('code on takeovers') ||
    content.includes('comprehensive')
  );
};

/**
 * Check if a request is likely to need batch processing
 */
export const shouldUseBatchProcessing = (userMessage: any): boolean => {
  if (!userMessage || typeof userMessage.content !== 'string') return false;
  
  // For long requests or those likely to have large responses, recommend batch processing
  return (
    isLikelyLargeResponse(userMessage) || 
    userMessage.content.length > 300
  );
};
