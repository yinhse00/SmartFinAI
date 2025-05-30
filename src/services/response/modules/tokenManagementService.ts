
/**
 * Constants for token limits across different query types and scenarios
 * Restored to original values for comprehensive responses
 */
const TOKEN_LIMITS = {
  DEFAULT: 20000,  // Restored from 2000
  RETRY: 30000,    // Restored from 3000
  RIGHTS_ISSUE_TIMETABLE: 35000,  // Restored from 4000
  DEFINITION_QUERY: 25000,  // Restored from 2500
  CONNECTED_TRANSACTION: 27500,  // Restored from 3000
  SPECIALIST_TECHNOLOGY: 30000,  // Restored from 3000
  SIMPLE_QUERY: 12500,  // Restored from 1200
  
  // Enhanced retry limits with restored sizes
  RETRY_ATTEMPT_1: 40000,  // Restored from 4000
  RETRY_ATTEMPT_2: 50000,  // Restored from 5000
  RETRY_ATTEMPT_3: 60000,  // Restored from 6000
  
  // Restored limits for complex financial queries
  COMPLEX_FINANCIAL_QUERY: 40000,  // Restored from 4000
  RIGHTS_ISSUE_WITH_WAIVER: 45000,  // Restored from 5000
  COMPLEX_TRANSACTION_TIMETABLE: 50000,  // Restored from 5000
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
      return Math.min(40000, TOKEN_LIMITS.DEFAULT * (1 + (batchNumber * 0.1)));
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
