
/**
 * Constants for token limits across different query types and scenarios
 */
const TOKEN_LIMITS = {
  DEFAULT: 20000,
  RETRY: 30000,
  RIGHTS_ISSUE_TIMETABLE: 35000,
  DEFINITION_QUERY: 25000,
  CONNECTED_TRANSACTION: 27500,
  SPECIALIST_TECHNOLOGY: 30000,
  SIMPLE_QUERY: 12500,
  
  // Enhanced retry limits with progressive increases
  RETRY_ATTEMPT_1: 40000,
  RETRY_ATTEMPT_2: 50000,
  RETRY_ATTEMPT_3: 60000,
  
  // New limits for complex financial queries
  COMPLEX_FINANCIAL_QUERY: 40000,
  RIGHTS_ISSUE_WITH_WAIVER: 45000,
  COMPLEX_TRANSACTION_TIMETABLE: 50000,
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
    isBatchRequest?: boolean;
    batchNumber?: number;
    isComplexQuery?: boolean;
  }): number {
    const { 
      queryType, 
      isRetryAttempt, 
      prompt, 
      isSimpleQuery, 
      retryCount = 0, 
      isBatchRequest, 
      batchNumber,
      isComplexQuery 
    } = params;

    // For retry attempts, use progressively larger token limits
    if (isRetryAttempt) {
      if (retryCount >= 2) return TOKEN_LIMITS.RETRY_ATTEMPT_3;
      if (retryCount === 1) return TOKEN_LIMITS.RETRY_ATTEMPT_2;
      return TOKEN_LIMITS.RETRY_ATTEMPT_1;
    }

    // For batch requests, especially later parts, increase token limits
    if (isBatchRequest && batchNumber && batchNumber > 1) {
      // For continuation batches, use higher limits to ensure completion
      return Math.min(30000, TOKEN_LIMITS.DEFAULT * (1 + (batchNumber * 0.1)));
    }
    
    // Handle the complex financial query scenarios specially
    const promptLower = prompt.toLowerCase();
    
    // Check for the specific complex financial query patterns
    if (isComplexQuery || 
        (promptLower.includes('rights issue') && 
         (promptLower.includes('whitewash') || 
          promptLower.includes('waiver') || 
          promptLower.includes('timetable') ||
          promptLower.includes('schedule')))) {
      return TOKEN_LIMITS.RIGHTS_ISSUE_WITH_WAIVER;
    }
    
    if (promptLower.includes('timetable') && 
        (promptLower.includes('transaction') || 
         promptLower.includes('substantial acquisition'))) {
      return TOKEN_LIMITS.COMPLEX_TRANSACTION_TIMETABLE;
    }

    if (queryType === 'specialist_technology' || 
        promptLower.includes('chapter 18c') ||
        promptLower.includes('specialist technology')) {
      return TOKEN_LIMITS.SPECIALIST_TECHNOLOGY;
    }

    if (queryType === 'rights_issue' && 
        (promptLower.includes('timetable') || 
         promptLower.includes('schedule'))) {
      return TOKEN_LIMITS.RIGHTS_ISSUE_TIMETABLE;
    }

    if (promptLower.includes('what is') || 
        promptLower.includes('definition')) {
      return TOKEN_LIMITS.DEFINITION_QUERY;
    }

    if (promptLower.includes('connected person') || 
        promptLower.includes('connected transaction') ||
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
    isBatchRequest?: boolean;
    batchNumber?: number;
    isComplexQuery?: boolean;
  }): number {
    const { isRetryAttempt, queryType, prompt, isBatchRequest, batchNumber, isComplexQuery } = params;
    
    // Lower temperature for retries to get more deterministic results
    if (isRetryAttempt) {
      return 0.1;
    }
    
    // For batch continuations, use lower temperature for consistency
    if (isBatchRequest && batchNumber && batchNumber > 1) {
      return 0.1; // Lower temperature for batch continuations for consistency
    }
    
    // Specially handle complex financial queries with much lower temperature
    if (isComplexQuery || 
        (prompt.toLowerCase().includes('rights issue') && 
         (prompt.toLowerCase().includes('whitewash') || 
          prompt.toLowerCase().includes('waiver')))) {
      return 0.05; // Very low temperature for complex financial queries
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
  }
};
