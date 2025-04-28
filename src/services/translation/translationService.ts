
/**
 * Service for handling translations
 */
import { grokApiService } from '../api/grokApiService';
import { getGrokApiKey } from '../apiKeyService';
import { generateFallbackResponse } from '../fallbackResponseService';
import { useToast } from '@/hooks/use-toast';

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
        console.log(`Content length: ${params.content.length} characters`);
        
        // Ensure we're sending just the raw content without any prefixes or metadata
        const contentToTranslate = params.content.trim();
        
        // Enhanced translation prompt with specific instructions for financial content
        const requestBody = {
          messages: [
            { 
              role: 'system', 
              content: `You are a professional financial translator specializing in Hong Kong regulations and markets. 
              Translate the following content from ${sourceLang} to ${targetLang} with high accuracy, maintaining the 
              same level of detail, comprehensiveness, and technical precision as the original text. 
              
              CRITICAL INSTRUCTIONS:
              1. Ensure the translation is COMPLETE - DO NOT OMIT ANY INFORMATION from the source text
              2. Maintain all technical financial terms accurately and consistently
              3. Keep the same structure, formatting, paragraphs, and sections as the original
              4. Translate everything including examples, citations, references, and lists
              5. Do not add explanations, metadata, comments, or any content not in the original
              6. Maintain formal tone appropriate for financial/regulatory documents
              7. The translation MUST BE THE SAME LENGTH or LONGER than the original to ensure no information is lost
              8. Pay special attention to translate all numerical data, dates, and percentages accurately
              9. If you cannot translate a term, keep the original term and add the translation in parentheses
              
              Your translation must be comprehensive and maintain ALL the information, numbers, and details from the original text.` 
            },
            { 
              role: 'user', 
              content: contentToTranslate
            }
          ],
          model: "grok-3-mini-beta",
          temperature: 0.1, // Lower temperature for more accurate translations
          max_tokens: 8000,  // High token limit to prevent truncation
          top_p: 0.95        // Maintain high coherence
        };
        
        console.log('Making translation API request...');
        console.time('Translation API call');
        
        // Track API call statistics for debugging
        let apiCallAttempt = 1;
        let apiCallSuccess = false;
        
        // Make the API call with possible retry
        let data;
        try {
          data = await grokApiService.callChatCompletions(requestBody);
          apiCallSuccess = true;
          console.log('Translation API call succeeded on first attempt');
        } catch (firstAttemptError) {
          console.warn('First translation API call failed, retrying once:', firstAttemptError);
          apiCallAttempt++;
          
          // Wait before retry
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          try {
            data = await grokApiService.callChatCompletions(requestBody);
            apiCallSuccess = true;
            console.log('Translation API call succeeded on second attempt');
          } catch (retryError) {
            console.error('Translation API retry also failed:', retryError);
            throw retryError; // Re-throw to be caught by outer catch
          }
        }
        
        console.timeEnd('Translation API call');
        
        // Validate the response
        if (!data || !data.choices || !data.choices[0] || !data.choices[0].message) {
          console.error('Invalid API response structure:', data);
          throw new Error('Invalid response from translation API');
        }
        
        const translatedContent = data.choices[0].message.content;
        
        // Verify we got a reasonable translation (not empty or substantially shorter)
        if (!translatedContent || translatedContent.trim().length === 0) {
          console.error('Empty translation received');
          throw new Error('Empty translation received');
        }
        
        // Check if translation is suspiciously short (could indicate truncation)
        const originalLength = contentToTranslate.length;
        const translatedLength = translatedContent.length;
        const lengthRatio = translatedLength / originalLength;
        
        console.log(`Translation metrics - Original: ${originalLength} chars, Translated: ${translatedLength} chars, Ratio: ${lengthRatio.toFixed(2)}`);
        
        // For Chinese to English, reasonable ratio is ~1.5-2.5
        // For English to Chinese, reasonable ratio is ~0.5-0.9
        const isEnToCh = params.sourceLanguage === 'en' && params.targetLanguage === 'zh';
        const isChToEn = params.sourceLanguage === 'zh' && params.targetLanguage === 'en';
        
        const suspiciouslyShort = (isEnToCh && lengthRatio < 0.4) || (isChToEn && lengthRatio < 1.0);
        
        if (suspiciouslyShort) {
          console.warn(`Suspicious translation length ratio (${lengthRatio.toFixed(2)}), may indicate truncation or incomplete translation`);
        }
        
        console.log(`Translation completed successfully: ${contentToTranslate.substring(0, 50)}...`);
        
        return {
          text: translatedContent
        };
      } catch (apiError) {
        console.error("Error calling Grok API for translation:", apiError);
        console.error("Error details:", {
          message: apiError?.message,
          name: apiError?.name,
          stack: apiError?.stack?.substring(0, 200) // Limit stack trace size in logs
        });
        
        return generateFallbackResponse("translation", apiError instanceof Error ? apiError.message : "API error");
      }
    } catch (error) {
      console.error("Unhandled error during translation:", error);
      return generateFallbackResponse("translation", "Error during translation");
    }
  }
};
