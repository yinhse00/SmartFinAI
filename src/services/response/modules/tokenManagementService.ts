/**
 * Constants for token limits across different query types and scenarios
 * All limits are QUINTUPLED for expanded token allowance
 */
const TOKEN_LIMITS = {
  DEFAULT: 20000,  // was 4000, 5x
  RETRY: 30000,    // was 6000, 5x
  RIGHTS_ISSUE_TIMETABLE: 35000,  // was 7000, 5x
  DEFINITION_QUERY: 25000,  // was 5000, 5x
  CONNECTED_TRANSACTION: 27500,  // was 5500, 5x
  SPECIALIST_TECHNOLOGY: 30000,  // New entry for Chapter 18C
  SIMPLE_QUERY: 12500,  // was 2500, 5x
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
  }): number {
    const { queryType, isRetryAttempt, prompt, isSimpleQuery } = params;

    if (isRetryAttempt) {
      return TOKEN_LIMITS.RETRY;
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
        prompt.toLowerCase().includes('connected transaction')) {
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
  }): number {
    const { isRetryAttempt, queryType, prompt } = params;

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
  }
};
