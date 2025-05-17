
/**
 * Constants for token limits across different query types and scenarios
 * Optimized for faster responses while maintaining quality
 */
const TOKEN_LIMITS = {
  DEFAULT: 8000,  // Reduced from 20000
  RETRY: 10000,   // Reduced from 30000
  RIGHTS_ISSUE_TIMETABLE: 15000,  // Reduced from 35000
  DEFINITION_QUERY: 6000,  // Reduced from 25000
  CONNECTED_TRANSACTION: 10000,  // Reduced from 27500
  SPECIALIST_TECHNOLOGY: 12000,  // Reduced from 30000
  SIMPLE_QUERY: 4000,  // Reduced from 12500
  
  // Enhanced retry limits with optimized sizes
  RETRY_ATTEMPT_1: 10000,  // Reduced from 40000
  RETRY_ATTEMPT_2: 12000,  // Reduced from 50000
  RETRY_ATTEMPT_3: 15000,  // Reduced from 60000
  
  // Optimized limits for complex financial queries
  COMPLEX_FINANCIAL_QUERY: 12000,  // Reduced from 40000
  RIGHTS_ISSUE_WITH_WAIVER: 15000,  // Reduced from 45000
  COMPLEX_TRANSACTION_TIMETABLE: 15000,  // Reduced from 50000
} as const;

/**
 * Centralized token management service optimized for quality responses
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

    // For batch requests, limited increase for later parts
    if (isBatchRequest && batchNumber && batchNumber > 1) {
      return Math.min(15000, TOKEN_LIMITS.DEFAULT * (1 + (batchNumber * 0.1)));
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
   * Enhanced with balanced temperature settings (0.3-0.7)
   */
  getTemperature(params: {
    queryType: string;
    isRetryAttempt?: boolean;
    prompt: string;
    isBatchRequest?: boolean;
    batchNumber?: number;
    isComplexQuery?: boolean;
  }): number {
    const { queryType, isRetryAttempt, prompt, isComplexQuery } = params;
    
    // Use more balanced temperature settings based on query characteristics
    
    // For retry attempts, use lower temperature for more deterministic responses
    if (isRetryAttempt) {
      return 0.3;
    }
    
    // For simple, conversational queries use higher temperature for more creative responses
    if (queryType === 'conversational' || queryType === 'general') {
      return 0.7;
    }
    
    // For definition queries, use a balanced temperature
    if (prompt.toLowerCase().includes('what is') || 
        prompt.toLowerCase().includes('definition') ||
        prompt.toLowerCase().includes('explain')) {
      return 0.4;
    }
    
    // For complex regulatory queries that need precision, use lower temperature
    if (queryType === 'rights_issue' || 
        queryType === 'connected_transaction' ||
        queryType === 'takeovers' ||
        isComplexQuery ||
        prompt.toLowerCase().includes('timetable') ||
        prompt.toLowerCase().includes('requirements')) {
      return 0.3;
    }
    
    // Default to a balanced temperature for other queries
    return 0.5;
  }
};
