
import { generateFallbackResponse } from '../../fallbackResponseService';
import { TranslationResponse } from '../types';

/**
 * Provides fallback responses when translation fails
 */
export const fallbackHandler = {
  /**
   * Generate a fallback translation response
   */
  generateFallbackTranslation(error: any): TranslationResponse {
    console.error("Translation error occurred:", error);
    return generateFallbackResponse(
      "translation request", 
      error instanceof Error ? error.message : "Unknown translation error"
    );
  }
};
