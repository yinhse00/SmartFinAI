
/**
 * Constants for token limits across different query types and scenarios
 */
const TOKEN_LIMITS = {
  DEFAULT: 4000,
  RETRY: 6000,
  RIGHTS_ISSUE_TIMETABLE: 5000,
  DEFINITION_QUERY: 4500,
  CONNECTED_TRANSACTION: 4500,
  SIMPLE_QUERY: 2000,
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

    // Retry attempts get higher token limits
    if (isRetryAttempt) {
      return TOKEN_LIMITS.RETRY;
    }

    // Rights issue timetable queries need higher limits
    if (queryType === 'rights_issue' && 
        (prompt.toLowerCase().includes('timetable') || 
         prompt.toLowerCase().includes('schedule'))) {
      return TOKEN_LIMITS.RIGHTS_ISSUE_TIMETABLE;
    }

    // Definition queries need sufficient tokens
    if (prompt.toLowerCase().includes('what is') || 
        prompt.toLowerCase().includes('definition')) {
      return TOKEN_LIMITS.DEFINITION_QUERY;
    }

    // Connected transaction queries need sufficient tokens
    if (prompt.toLowerCase().includes('connected person') || 
        prompt.toLowerCase().includes('connected transaction')) {
      return TOKEN_LIMITS.CONNECTED_TRANSACTION;
    }

    // Simple queries can use lower token limits
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

    // Use very low temperature for retries
    if (isRetryAttempt) {
      return 0.1;
    }

    // Rights issue timetables need very low temperature
    if (queryType === 'rights_issue' && 
        (prompt.toLowerCase().includes('timetable') || 
         prompt.toLowerCase().includes('schedule'))) {
      return 0.05;
    }

    // Definition queries need low temperature
    if (prompt.toLowerCase().includes('what is') || 
        prompt.toLowerCase().includes('definition')) {
      return 0.1;
    }

    return 0.3; // Default temperature
  }
};
