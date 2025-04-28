
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
        
        // Enhanced translation prompt for improved quality and completeness
        const requestBody = {
          messages: [
            { 
              role: 'system', 
              content: `You are a professional financial translator specializing in Hong Kong regulations and markets. 
              Translate the following content from ${sourceLang} to ${targetLang} with high accuracy, maintaining the 
              same level of detail, comprehensiveness, and technical precision as the original text. 
              
              IMPORTANT INSTRUCTIONS:
              1. Ensure the translation is COMPLETE and contains ALL information from the source text
              2. Maintain all technical financial terms accurately 
              3. Keep the same structure and format as the original
              4. Translate everything including examples, citations, and references
              5. Do not add any explanations, metadata, or personal comments
              6. Do not omit any information or summarize the content
              7. Maintain formal tone appropriate for financial/regulatory documents
              
              Translate the entire text completely, keeping ALL information from the original.` 
            },
            { 
              role: 'user', 
              content: contentToTranslate
            }
          ],
          model: "grok-3-mini-beta",
          temperature: 0.1, // Lower temperature for more accurate translations
          max_tokens: 8000  // Increased token limit to prevent truncated translations
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
