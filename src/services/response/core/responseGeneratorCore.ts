
import { apiCallHandler } from './api/apiCallHandler';
import { responseTokenizer } from './responseHandling/responseTokenizer';
import { tokenManagementService } from '../modules/tokenManagementService';

/**
 * Core response generation functionality
 */
export const responseGeneratorCore = {
  /**
   * Make API call with proper error handling and retry logic
   */
  makeApiCall: async (requestBody: any, apiKey: string) => {
    return await apiCallHandler.makeApiCall(requestBody, apiKey);
  },
  
  /**
   * Make backup API call with simplified parameters
   * Enhanced with more resilient configuration
   */
  makeBackupApiCall: async (prompt: string, queryType: string | null, apiKey: string) => {
    return await apiCallHandler.makeBackupApiCall(prompt, queryType, apiKey);
  },
  
  /**
   * Check if response needs to be truncated due to token limits
   * Returns a message to be appended to the response if truncation occurred
   */
  checkAndHandleTokenLimit: (responseText: string, tokenCount: number): {
    truncated: boolean,
    text: string
  } => {
    return responseTokenizer.checkAndHandleTokenLimit(responseText, tokenCount);
  }
};
