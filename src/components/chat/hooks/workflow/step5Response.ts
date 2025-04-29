
import { grokService } from '@/services/grokService';

/**
 * Step 5: Response Generation
 * - Compile final response from all context
 * - Translate to Chinese if original query was Chinese
 */
export const executeStep5 = async (
  params: any, 
  setStepProgress: (progress: string) => void,
  lastInputWasChinese: boolean
) => {
  setStepProgress('Generating final response');
  
  try {
    // Prepare the response parameters with all available context
    const responseContext = params.regulatoryContext || 
                           params.executionContext || 
                           params.listingRulesContext || 
                           params.takeoversCodeContext || '';
    
    const responseParams = {
      prompt: params.query,
      regulatoryContext: responseContext
    };
    
    // Generate response using Grok
    const response = await grokService.generateResponse(responseParams);
    let responseText = '';
    
    if (typeof response === 'object' && response !== null && 'text' in response) {
      responseText = response.text;
    } else if (typeof response === 'string') {
      responseText = response;
    }
    
    // Step 5(b): If original input was Chinese, translate response
    if (lastInputWasChinese) {
      setStepProgress('Translating response to Chinese');
      
      try {
        const translation = await grokService.translateContent({
          content: responseText,
          sourceLanguage: 'en',
          targetLanguage: 'zh'
        });
        
        let translatedText = '';
        
        if (typeof translation === 'object' && translation !== null && 'text' in translation) {
          translatedText = translation.text || '';
        } else if (typeof translation === 'string') {
          translatedText = translation;
        }
        
        return {
          completed: true,
          originalResponse: responseText,
          translatedResponse: translatedText,
          requiresTranslation: true
        };
      } catch (translationError) {
        console.error('Translation error:', translationError);
        
        // Return original response if translation fails
        return {
          completed: true,
          response: responseText,
          translationError,
          requiresTranslation: true
        };
      }
    }
    
    // Return English response
    return {
      completed: true,
      response: responseText
    };
  } catch (error) {
    console.error('Error in step 5:', error);
    return { 
      completed: false,
      error
    };
  }
};
