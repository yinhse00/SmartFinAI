
/**
 * Service for handling translations
 */
import { getGrokApiKey } from '../apiKeyService';
import { fallbackHandler } from './utils/fallbackHandler';
import { translationCore } from './core/translationCore';
import { retryHandler } from './core/retryHandler';
import { TranslationParams, TranslationResponse } from './types';

export const translationService = {
  /**
   * Translate content using Grok AI
   */
  translateContent: async (params: TranslationParams): Promise<TranslationResponse> => {
    try {
      const apiKey = getGrokApiKey();
      
      if (!apiKey) {
        console.log("No API key provided, using fallback response");
        return fallbackHandler.generateFallbackTranslation(new Error("No API key provided"));
      }
      
      try {
        // Use the translation core to handle the main translation logic
        const response = await translationCore.translate(params, apiKey);
        
        // If English to Chinese with suspiciously short result, try a retry
        const isEnToCh = params.sourceLanguage === 'en' && params.targetLanguage === 'zh';
        const lengthRatio = response.text.length / params.content.length;
        
        if (isEnToCh && lengthRatio < 0.4) {
          // Try a retry with different parameters
          const retryTranslation = await retryHandler.retryTranslation(params.content, apiKey);
          
          // If retry succeeds and is better (longer), use it
          if (retryTranslation && retryTranslation.length > response.text.length * 1.2) {
            console.log('Using retry translation as it appears more comprehensive');
            return { text: retryTranslation };
          }
        }
        
        return response;
      } catch (apiError) {
        console.error("Error calling Grok API for translation:", apiError);
        return fallbackHandler.generateFallbackTranslation(apiError);
      }
    } catch (error) {
      console.error("Unhandled error during translation:", error);
      return fallbackHandler.generateFallbackTranslation(error);
    }
  }
};
