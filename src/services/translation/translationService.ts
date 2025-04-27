
/**
 * Service for handling translations
 */
import { grokApiService } from '../api/grokApiService';
import { getGrokApiKey } from '../apiKeyService';
import { generateFallbackResponse } from '../fallbackResponseService';

interface TranslationParams {
  content: string;
  sourceLanguage: 'en' | 'zh';
  targetLanguage: 'en' | 'zh';
  format?: string;
}

interface TranslationResponse {
  text: string;
}

export const translationService = {
  /**
   * Translate content using Grok AI
   */
  translateContent: async (params: TranslationParams): Promise<TranslationResponse> => {
    try {
      const apiKey = getGrokApiKey();
      
      if (!apiKey) {
        console.log("No API key provided, using fallback response");
        return generateFallbackResponse("translation request", "No API key provided");
      }
      
      const sourceLang = params.sourceLanguage === 'en' ? 'English' : 'Chinese';
      const targetLang = params.targetLanguage === 'en' ? 'English' : 'Chinese';
      
      try {
        console.log("Connecting to Grok API for translation");
        
        // Ensure we're sending just the raw content without any prefixes or metadata
        const contentToTranslate = params.content.trim();
        
        const requestBody = {
          messages: [
            { 
              role: 'system', 
              content: `You are a professional translator. Translate the following content from ${sourceLang} to ${targetLang}. Translate only the text provided and do not add any explanations, context, or metadata. Do not include phrases like "Content extracted from" in your translation. Use a natural, fluent style appropriate for ${targetLang}.` 
            },
            { 
              role: 'user', 
              content: contentToTranslate
            }
          ],
          model: "grok-3-mini-beta",
          temperature: 0.3, // Lower temperature for more accurate translations
          max_tokens: 4000  // Allow for longer translations
        };
        
        const data = await grokApiService.callChatCompletions(requestBody);
        
        return {
          text: data.choices?.[0]?.message?.content || "Translation failed."
        };
      } catch (apiError) {
        console.error("Error calling Grok API for translation:", apiError);
        return generateFallbackResponse("translation", apiError instanceof Error ? apiError.message : "API error");
      }
    } catch (error) {
      console.error("Error during translation:", error);
      return generateFallbackResponse("translation", "Error during translation");
    }
  }
};
