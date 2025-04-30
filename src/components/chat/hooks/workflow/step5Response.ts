
import { grokService } from '@/services/grokService';
import { safelyExtractText } from '@/services/utils/responseUtils';

/**
 * Step 5: Response Generation
 * - Compile final response from all context
 * - Structure response according to guidelines
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
    // Step 5.1: Rearrange output components
    const responseComponents = {
      finalAnalysis: '',
      documentsToBePrep: params.executionResults?.documentsChecklist || '',
      workingPlan: params.executionResults?.workingPlan || '',
      executionTimetable: params.executionResults?.timetable || ''
    };
    
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
    
    // Build a structured prompt that ensures the response format follows Step 5.1
    const structuredPrompt = `
Based on the following query: "${params.query}"

${params.executionResults ? `
Please provide a comprehensive response that includes the following sections:
1. Final analysis of the query
${params.executionResults.documentsChecklist ? '2. Documents to be prepared for this transaction' : ''}
${params.executionResults.workingPlan ? '3. Working plan for execution' : ''}
${params.executionResults.timetable ? '4. Execution timetable with key dates' : ''}

Ensure each section is clearly labeled and provide comprehensive details for each applicable section.
` : 'Please provide a comprehensive analysis of this query.'}

${isPotentiallyLongResponse ? 'This query may require multiple parts. Please focus on the most important information first and structure your response to work well with continuation.' : ''}
`;
    
    const responseParams = {
      prompt: structuredPrompt,
      regulatoryContext: responseContext,
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
    
    // Step 5.2: If original input was Chinese, translate response
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
