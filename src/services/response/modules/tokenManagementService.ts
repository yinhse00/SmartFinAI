
/**
 * Constants for token limits across different query types and scenarios
 * Significantly reduced for faster responses
 */
const TOKEN_LIMITS = {
  DEFAULT: 2000,  // Reduced from 20000
  RETRY: 3000,    // Reduced from 30000
  RIGHTS_ISSUE_TIMETABLE: 4000,  // Reduced from 35000
  DEFINITION_QUERY: 2500,  // Reduced from 25000
  CONNECTED_TRANSACTION: 3000,  // Reduced from 27500
  SPECIALIST_TECHNOLOGY: 3000,  // Reduced from 30000
  SIMPLE_QUERY: 1200,  // Reduced from 12500
  
  // Enhanced retry limits with reduced sizes
  RETRY_ATTEMPT_1: 4000,  // Reduced from 40000
  RETRY_ATTEMPT_2: 5000,  // Reduced from 50000
  RETRY_ATTEMPT_3: 6000,  // Reduced from 60000
  
  // New limits for complex financial queries
  COMPLEX_FINANCIAL_QUERY: 4000,  // Reduced from 40000
  RIGHTS_ISSUE_WITH_WAIVER: 5000,  // Reduced from 45000
  COMPLEX_TRANSACTION_TIMETABLE: 5000,  // Reduced from 50000
} as const;

/**
 * Centralized token management service optimized for faster responses
 */
export const tokenManagementService = {
  /**
   * Get appropriate token limit based on query characteristics
   * Optimized for speed
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

    // For batch requests, limited increase for later parts
    if (isBatchRequest && batchNumber && batchNumber > 1) {
      return Math.min(4000, TOKEN_LIMITS.DEFAULT * (1 + (batchNumber * 0.1)));
    }
    
    // Special case handling
    const promptLower = prompt.toLowerCase();
    
    if (isComplexQuery || 
        (promptLower.includes('rights issue') && promptLower.includes('timetable'))) {
      return TOKEN_LIMITS.RIGHTS_ISSUE_WITH_WAIVER;
    }
    
    if (promptLower.includes('timetable')) {
      return TOKEN_LIMITS.COMPLEX_TRANSACTION_TIMETABLE;
    }

    if (queryType === 'specialist_technology' || 
        promptLower.includes('chapter 18c')) {
      return TOKEN_LIMITS.SPECIALIST_TECHNOLOGY;
    }

    if (queryType === 'rights_issue' && 
        promptLower.includes('timetable')) {
      return TOKEN_LIMITS.RIGHTS_ISSUE_TIMETABLE;
    }

    if (promptLower.includes('what is') || 
        promptLower.includes('definition')) {
      return TOKEN_LIMITS.DEFINITION_QUERY;
    }

    if (promptLower.includes('connected')) {
      return TOKEN_LIMITS.CONNECTED_TRANSACTION;
    }

    if (isSimpleQuery) {
      return TOKEN_LIMITS.SIMPLE_QUERY;
    }

    return TOKEN_LIMITS.DEFAULT;
  },

  /**
   * Get temperature setting based on query type and retry status
   * Lower temperatures for more deterministic, faster responses
   */
  getTemperature(params: {
    queryType: string;
    isRetryAttempt?: boolean;
    prompt: string;
    isBatchRequest?: boolean;
    batchNumber?: number;
    isComplexQuery?: boolean;
  }): number {
    // Always use low temperature for faster, more deterministic responses
    return 0.1;
  }
};
