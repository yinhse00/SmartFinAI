
import { grokService } from '@/services/grokService';
import { safelyExtractText } from '@/services/utils/responseUtils';

/**
 * Step 5: Response Generation
 * - Compile final response from all context
 * - Translate to Chinese if original query was Chinese
 * - Support automatic batching for long responses
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
    
    // Check if the query is likely to need batching
    const isPotentiallyLongResponse = params.query.length > 300 || 
                                     params.query.toLowerCase().includes('timetable') ||
                                     params.query.toLowerCase().includes('rights issue') ||
                                     params.query.toLowerCase().includes('connected transaction');
    
    const responseParams = {
      prompt: isPotentiallyLongResponse 
        ? `${params.query} [NOTE: This query may require multiple parts. Please focus on the most important information first and structure your response to work well with continuation.]` 
        : params.query,
      regulatoryContext: responseContext,
      // Set a modest token limit to encourage batching rather than one huge response
      maxTokens: isPotentiallyLongResponse ? 4000 : undefined
    };
    
    // Generate response using Grok
    const response = await grokService.generateResponse(responseParams);
    
    // Extract response text safely using our utility
    const responseText = safelyExtractText(response);
    
    // Check if the response appears truncated or incomplete
    const appearsTruncated = responseText.includes('...') || 
                            responseText.includes('to be continued') ||
                            responseText.includes('in the next part') ||
                            responseText.length > 3500;
    
    const metadata = {
      ...response.metadata,
      mayRequireBatching: isPotentiallyLongResponse || appearsTruncated,
      batchSuggestion: appearsTruncated ? "This response appears to be incomplete. Consider using the Continue button to see additional information." : undefined
    };
    
    // Step 5(b): If original input was Chinese, translate response
    if (lastInputWasChinese) {
      setStepProgress('Translating response to Chinese');
      
      try {
        const translation = await grokService.translateContent({
          content: responseText,
          sourceLanguage: 'en',
          targetLanguage: 'zh'
        });
        
        // Extract translated text safely using our utility
        const translatedText = safelyExtractText(translation);
        
        return {
          completed: true,
          originalResponse: responseText,
          translatedResponse: translatedText,
          requiresTranslation: true,
          metadata
        };
      } catch (translationError) {
        console.error('Translation error:', translationError);
        
        // Return original response if translation fails
        return {
          completed: true,
          response: responseText,
          translationError,
          requiresTranslation: true,
          metadata
        };
      }
    }
    
    // Return English response
    return {
      completed: true,
      response: responseText,
      metadata
    };
  } catch (error) {
    console.error('Error in step 5:', error);
    return { 
      completed: false,
      error
    };
  }
};
