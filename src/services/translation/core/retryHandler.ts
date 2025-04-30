
import { grokApiService } from '../../api/grokApiService';

/**
 * Handles translation retry attempts
 */
export const retryHandler = {
  /**
   * Attempts a translation retry with modified parameters
   */
  async retryTranslation(content: string, apiKey?: string): Promise<string | null> {
    console.log('Attempting a retry translation with modified prompt');
    
    const retryRequestBody = {
      messages: [
        { 
          role: 'system', 
          content: `You are a professional translator. Your task is to translate the following text into Chinese. 
          The translation MUST be comprehensive and include ALL details from the original text. 
          Do not summarize or shorten the text in any way. This is extremely important.
          
          Translate EVERY SINGLE WORD and ensure the Chinese translation is as detailed as the original text.`
        },
        { role: 'user', content }
      ],
      model: "grok-3-beta",
      temperature: 0.05 // Even lower temperature for more literal translation
    };
    
    try {
      const retryData = await grokApiService.callChatCompletions(retryRequestBody, apiKey);
      return retryData.choices[0].message.content;
    } catch (error) {
      console.warn('Retry translation attempt failed:', error);
      return null;
    }
  }
};
