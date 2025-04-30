
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
  shouldTranslateToChineseResponse: boolean
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
    
    // Extract references if available in the response
    const references = response.metadata?.referenceDocumentsUsed ? 
      (Array.isArray(response.metadata.references) ? response.metadata.references : []) : 
      [];
    
    // Check if using fallback mode
    const isUsingFallback = !!response.metadata?.isBackupResponse || 
                           !!response.metadata?.isOfflineMode;
    
    // Get reasoning if available
    const reasoning = params.reasoning || '';
    
    // Determine if this is part of a batch response
    const isBatchPart = !!params.isBatchContinuation || false;
    
    // Step 5.2: If original input was Chinese or translation is requested, translate response
    if (shouldTranslateToChineseResponse) {
      setStepProgress('Translating response to Chinese');
      
      try {
        // Check if we should translate to simplified or traditional Chinese
        const targetLanguage = params.originalLanguageWasChinese ? 
          (isSimplifiedChinese(params.query) ? 'zh-CN' : 'zh-TW') : 
          'zh-CN'; // Default to simplified if we can't determine
        
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
          metadata,
          isTruncated: appearsTruncated,
          references,
          isUsingFallback,
          reasoning,
          isBatchPart
        };
      } catch (translationError) {
        console.error('Translation error:', translationError);
        
        // Return original response if translation fails
        return {
          completed: true,
          response: responseText,
          translationError,
          requiresTranslation: true,
          metadata,
          isTruncated: appearsTruncated,
          references,
          isUsingFallback,
          reasoning,
          isBatchPart
        };
      }
    }
    
    // Return English response
    return {
      completed: true,
      response: responseText,
      metadata,
      isTruncated: appearsTruncated,
      references,
      isUsingFallback,
      reasoning,
      isBatchPart
    };
  } catch (error) {
    console.error('Error in step 5:', error);
    return { 
      completed: false,
      error
    };
  }
};

// Helper function to detect simplified Chinese
function isSimplifiedChinese(text: string): boolean {
  // This is a simplified check - a more accurate implementation would check for 
  // specific simplified Chinese characters that differ from traditional
  const simplifiedChars = '简体中文销售专业谁见';
  const traditionalChars = '繁體中文銷售專業誰見';
  
  let simplifiedCount = 0;
  let traditionalCount = 0;
  
  for (const char of text) {
    if (simplifiedChars.includes(char)) simplifiedCount++;
    if (traditionalChars.includes(char)) traditionalCount++;
  }
  
  return simplifiedCount > traditionalCount;
}
