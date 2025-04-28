
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
        console.log(`Translating from ${sourceLang} to ${targetLang}`);
        
        // Ensure we're sending just the raw content without any prefixes or metadata
        const contentToTranslate = params.content.trim();
        
        // Enhanced translation prompt for improved accuracy
        const requestBody = {
          messages: [
            { 
              role: 'system', 
              content: `You are a professional financial translator specializing in Hong Kong regulations and markets. Translate the following content from ${sourceLang} to ${targetLang} with high accuracy and financial terminology precision. Maintain formal tone appropriate for financial documents. Do not add any explanations or metadata. Translate the entire content completely.` 
            },
            { 
              role: 'user', 
              content: contentToTranslate
            }
          ],
          model: "grok-3-mini-beta",
          temperature: 0.2, // Lower temperature for more accurate translations
          max_tokens: 5000  // Increased token limit to prevent truncated translations
        };
        
        const data = await grokApiService.callChatCompletions(requestBody);
        
        // Log translation completion
        console.log(`Translation completed successfully: ${contentToTranslate.substring(0, 50)}...`);
        
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
