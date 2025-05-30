
import { GrokResponse } from '@/types/grok';
import { generateFallbackResponse } from '../../fallbackResponseService';

/**
 * Handles API errors and provides appropriate fallback mechanisms
 */
export const errorHandler = {
  /**
   * Log API error details
   */
  logApiError: (error: unknown, prompt: string): void => {
    console.error('Hong Kong Financial Expert Response Error:', error);
    console.group('Fallback Response Details');
    console.log('Error Type:', error instanceof Error ? error.name : 'Unknown Error');
    console.log('Error Message:', error instanceof Error ? error.message : error);
    console.log('Query:', prompt);
    console.groupEnd();
  },
  
  /**
   * Create fallback response when API calls fail
   * Enhanced to provide better user experience during API outages
   */
  createFallbackResponse: (prompt: string, error: unknown): GrokResponse => {
    const errorMessage = error instanceof Error ? error.message : 'Unexpected error';
    const isNetworkError = 
      errorMessage.includes('fetch') || 
      errorMessage.includes('network') ||
      errorMessage.includes('Failed to') ||
      errorMessage.includes('CORS') ||
      errorMessage.includes('abort') ||
      errorMessage.includes('timeout') ||
      errorMessage.includes('429') ||  // Too many requests
      errorMessage.includes('500') ||  // Server error
      errorMessage.includes('AbortError');
    
    // For network errors, provide a clearer message
    if (isNetworkError) {
      console.log("Network error detected, providing offline mode fallback");
      return {
        text: "I'm currently in offline mode because I'm unable to connect to the specialized financial expertise service. This is likely due to network connectivity issues, CORS restrictions, or service maintenance.\n\n" +
              "For questions about Hong Kong listing rules and regulations, I can provide general guidance based on my core knowledge, but I cannot access the specialized regulatory database for detailed citations.\n\n" +
              "You can try reconnecting by clicking the 'Try Reconnect' button above, or continue using offline mode with limited functionality.",
        queryType: 'system',
        metadata: {
          contextUsed: false,
          relevanceScore: 0,
          isBackupResponse: true,
          error: "Network connection error",
          isOfflineMode: true
        }
      };
    }
    
    // API key errors
    if (errorMessage.includes('key') || errorMessage.includes('auth') || errorMessage.includes('401')) {
      console.log("API key error detected, providing specific auth error fallback");
      return {
        text: "There seems to be an issue with the API authentication. The system cannot access the financial expertise database with the current credentials.\n\n" +
              "This could be due to an expired API key or authentication issues. Please try updating your API key in the settings.",
        queryType: 'system',
        metadata: {
          contextUsed: false,
          relevanceScore: 0,
          isBackupResponse: true,
          error: "API authentication error"
        }
      };
    }
    
    // Default to standard fallback response for other errors
    return generateFallbackResponse(prompt, errorMessage);
  }
};
