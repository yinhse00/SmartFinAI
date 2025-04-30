
import { grokApiService } from '../../api/grokApiService';
import { getGrokApiKey } from '../../apiKeyService';
import { TranslationParams, TranslationResponse } from '../types';
import { translationPromptBuilder } from './translationPromptBuilder';
import { responseValidator } from './responseValidator';

/**
 * Core translation functionality
 */
export const translationCore = {
  /**
   * Sends translation request to the API
   */
  async translate(params: TranslationParams, apiKey?: string): Promise<TranslationResponse> {
    console.log(`Translating from ${params.sourceLanguage === 'en' ? 'English' : 'Chinese'} to ${params.targetLanguage === 'en' ? 'English' : 'Chinese'}`);
    console.log(`Content length: ${params.content.length} characters`);
    
    // Ensure we're sending just the raw content without any prefixes or metadata
    const contentToTranslate = params.content.trim();
    
    // Build the request body using the prompt builder
    const requestBody = translationPromptBuilder.buildTranslationPrompt(
      contentToTranslate,
      params.sourceLanguage,
      params.targetLanguage
    );
    
    console.log('Making translation API request...');
    console.time('Translation API call');
    
    // Track API call statistics for debugging
    let apiCallAttempt = 1;
    let apiCallSuccess = false;
    
    // Make the API call with possible retry
    let data;
    try {
      data = await grokApiService.callChatCompletions(requestBody, apiKey);
      apiCallSuccess = true;
      console.log('Translation API call succeeded on first attempt');
    } catch (firstAttemptError) {
      console.warn('First translation API call failed, retrying once:', firstAttemptError);
      apiCallAttempt++;
      
      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      try {
        data = await grokApiService.callChatCompletions(requestBody, apiKey);
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
    
    // Validate the translation
    const validationResult = responseValidator.validateTranslation(
      contentToTranslate,
      translatedContent,
      params.sourceLanguage,
      params.targetLanguage
    );
    
    if (validationResult.needsRetry && apiCallSuccess && apiCallAttempt < 2) {
      console.log('Translation validation suggests a retry with modified prompt');
      // Implementation of retry logic would go here if needed
    }
    
    console.log(`Translation completed successfully: ${contentToTranslate.substring(0, 50)}...`);
    
    return {
      text: translatedContent
    };
  }
};
