
import React from 'react';

/**
 * Constants for token limits across different query types and scenarios
 * Significantly increased limits to prevent truncation in financial regulatory responses
 */
const TOKEN_LIMITS = {
  DEFAULT: 800000,      // Increased from 500000
  RETRY: 1000000,       // Increased from 600000
  RIGHTS_ISSUE_TIMETABLE: 1200000, // Increased from 550000
  OPEN_OFFER_TIMETABLE: 1200000,   // Added specifically for open offers
  DEFINITION_QUERY: 700000,   // Increased from 500000
  CONNECTED_TRANSACTION: 700000,  // Increased from 500000
  SIMPLE_QUERY: 400000,  // Increased from 300000
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

    // Open offer timetable queries need higher limits
    if (queryType === 'open_offer' && 
        (prompt.toLowerCase().includes('timetable') || 
         prompt.toLowerCase().includes('schedule') ||
         prompt.toLowerCase().includes('trading arrangement'))) {
      return TOKEN_LIMITS.OPEN_OFFER_TIMETABLE;
    }

    // Rights issue timetable queries need higher limits
    if (queryType === 'rights_issue' && 
        (prompt.toLowerCase().includes('timetable') || 
         prompt.toLowerCase().includes('schedule') ||
         prompt.toLowerCase().includes('trading arrangement'))) {
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
      return 0.05; // Reduced from 0.1 for more deterministic output
    }

    // Trading arrangement timetables need extremely low temperature for maximum accuracy
    if ((queryType === 'rights_issue' || queryType === 'open_offer') && 
        (prompt.toLowerCase().includes('timetable') || 
         prompt.toLowerCase().includes('schedule') ||
         prompt.toLowerCase().includes('trading arrangement'))) {
      return 0.02; // Even lower temperature for critical regulatory information
    }

    // Definition queries need low temperature
    if (prompt.toLowerCase().includes('what is') || 
        prompt.toLowerCase().includes('definition')) {
      return 0.1;
    }

    return 0.3; // Default temperature
  }
};
