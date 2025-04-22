
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
    const isNetworkError = errorMessage.includes('fetch') || errorMessage.includes('network');
    
    // For network errors, provide a clearer message
    if (isNetworkError) {
      return {
        text: "I'm currently unable to connect to my financial expertise service. This could be due to network connectivity issues or service maintenance.\n\n" +
              "For questions about Hong Kong listing rules and regulations, I would normally provide detailed information from official sources. " +
              "Until the connection is restored, I can only offer limited assistance.\n\n" +
              "Please try again in a few moments, or contact support if this issue persists.",
        queryType: 'general',
        metadata: {
          contextUsed: false,
          relevanceScore: 0,
          isBackupResponse: true,
          error: "Connection error"  // This line was causing the TypeScript error, but now it's fixed
        }
      };
    }
    
    // Default to standard fallback response for other errors
    return generateFallbackResponse(prompt, errorMessage);
  }
};
