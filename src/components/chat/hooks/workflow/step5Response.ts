
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
    
    // Step 5(b): If original input was Chinese, translate response
    if (lastInputWasChinese) {
      setStepProgress('Translating response to Chinese');
      
      try {
        const translation = await grokService.translateContent(response.text, 'zh');
        
        return {
          completed: true,
          originalResponse: response.text,
          translatedResponse: translation.text,
          requiresTranslation: true
        };
      } catch (translationError) {
        console.error('Translation error:', translationError);
        
        // Return original response if translation fails
        return {
          completed: true,
          response: response.text,
          translationError,
          requiresTranslation: true
        };
      }
    }
    
    // Return English response
    return {
      completed: true,
      response: response.text
    };
  } catch (error) {
    console.error('Error in step 5:', error);
    return { 
      completed: false,
      error
    };
  }
};
