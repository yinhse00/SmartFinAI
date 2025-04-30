
/**
 * Constants for token limits across different query types and scenarios
 */
const TOKEN_LIMITS = {
  DEFAULT: 24000,               // Increased from 20000
  RETRY: 36000,                 // Increased from 30000
  RIGHTS_ISSUE_TIMETABLE: 42000, // Increased from 35000
  DEFINITION_QUERY: 30000,      // Increased from 25000
  CONNECTED_TRANSACTION: 33000, // Increased from 27500
  SPECIALIST_TECHNOLOGY: 36000, // Increased from 30000
  SIMPLE_QUERY: 15000,          // Increased from 12500
  
  // Enhanced retry limits with progressive increases
  RETRY_ATTEMPT_1: 48000,       // Increased from 40000
  RETRY_ATTEMPT_2: 60000,       // Increased from 50000
  RETRY_ATTEMPT_3: 72000,       // Increased from 60000
  
  // New batch-specific limits
  INITIAL_BATCH: 8000,         // For first part of a long response
  CONTINUATION_BATCH: 12000,   // For subsequent parts
} as const;

/**
 * Centralized token management service
 */
export const tokenManagementService = {
  /**
   * Get appropriate token limit based on query characteristics
   */
  getTokenLimit(params: {
    queryType: string;
    isRetryAttempt?: boolean;
    prompt: string;
    isSimpleQuery?: boolean;
    retryCount?: number;
    isBatchContinuation?: boolean;
    batchNumber?: number;
  }): number {
    const { queryType, isRetryAttempt, prompt, isSimpleQuery, retryCount = 0, isBatchContinuation = false, batchNumber = 0 } = params;

    // Special handling for batch continuation responses
    if (isBatchContinuation) {
      return batchNumber <= 1 ? TOKEN_LIMITS.INITIAL_BATCH : TOKEN_LIMITS.CONTINUATION_BATCH;
    }

    // For retry attempts, use progressively larger token limits
    if (isRetryAttempt) {
      if (retryCount >= 2) return TOKEN_LIMITS.RETRY_ATTEMPT_3;
      if (retryCount === 1) return TOKEN_LIMITS.RETRY_ATTEMPT_2;
      return TOKEN_LIMITS.RETRY_ATTEMPT_1;
    }

    if (queryType === 'specialist_technology' || 
        prompt.toLowerCase().includes('chapter 18c') ||
        prompt.toLowerCase().includes('specialist technology')) {
      return TOKEN_LIMITS.SPECIALIST_TECHNOLOGY;
    }

    if (queryType === 'rights_issue' && 
        (prompt.toLowerCase().includes('timetable') || 
         prompt.toLowerCase().includes('schedule'))) {
      return TOKEN_LIMITS.RIGHTS_ISSUE_TIMETABLE;
    }

    if (prompt.toLowerCase().includes('what is') || 
        prompt.toLowerCase().includes('definition')) {
      return TOKEN_LIMITS.DEFINITION_QUERY;
    }

    if (prompt.toLowerCase().includes('connected person') || 
        prompt.toLowerCase().includes('connected transaction') ||
        queryType === 'connected_transaction') {
      return TOKEN_LIMITS.CONNECTED_TRANSACTION;
    }

    if (isSimpleQuery) {
      return TOKEN_LIMITS.SIMPLE_QUERY;
    }

    return TOKEN_LIMITS.DEFAULT;
  },

  /**
   * Get temperature setting based on query type and retry status
   */
  getTemperature(params: {
    queryType: string;
    isRetryAttempt?: boolean;
    prompt: string;
    isBatchContinuation?: boolean;
  }): number {
    const { isRetryAttempt, queryType, prompt, isBatchContinuation = false } = params;

    // Use very low temperature for batch continuations to maintain consistency
    if (isBatchContinuation) {
      return 0.05;
    }

    if (isRetryAttempt) {
      return 0.1;
    }

    if (queryType === 'specialist_technology' || 
        prompt.toLowerCase().includes('chapter 18c')) {
      return 0.05; // Lower temperature for more accurate Chapter 18C responses
    }

    if (queryType === 'rights_issue' && 
        (prompt.toLowerCase().includes('timetable') || 
         prompt.toLowerCase().includes('schedule'))) {
      return 0.05;
    }

    if (prompt.toLowerCase().includes('what is') || 
        prompt.toLowerCase().includes('definition')) {
      return 0.1;
    }

    return 0.3; // Default temperature
  },

  /**
   * Determine if a query is likely to need batching
   */
  shouldUseBatching(prompt: string, queryType: string): boolean {
    // Check for characteristics that typically require batching
    return prompt.length > 250 || 
           queryType === 'rights_issue' ||
           queryType === 'connected_transaction' ||
           prompt.toLowerCase().includes('timetable') ||
           prompt.toLowerCase().includes('chapter 14a') || 
           prompt.toLowerCase().includes('connected transaction');
  },

  /**
   * Get optimal batch size for a query
   */
  getBatchSize(queryType: string, isFirstBatch: boolean): number {
    if (isFirstBatch) {
      return TOKEN_LIMITS.INITIAL_BATCH;
    }
    
    if (queryType === 'rights_issue' || queryType === 'connected_transaction') {
      return TOKEN_LIMITS.CONTINUATION_BATCH;
    }
    
    return TOKEN_LIMITS.CONTINUATION_BATCH;
  }
};
