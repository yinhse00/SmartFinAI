
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
   */
  createFallbackResponse: (prompt: string, error: unknown): GrokResponse => {
    const errorMessage = error instanceof Error ? error.message : 'Unexpected error';
    return generateFallbackResponse(prompt, errorMessage);
  }
};
