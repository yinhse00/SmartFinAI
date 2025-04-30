
import { grokService } from '@/services/grokService';
import { safelyExtractText } from '@/services/utils/responseUtils';

/**
 * Step 5: Response Generation
 * - Compile final response from all context
 * - Organize response sections (Rules Analysis, Documents, Execution Plan, Timetable)
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
    // Collect all available context sections
    const rulesAnalysis = params.regulatoryContext || 
                         params.listingRulesContext || 
                         params.takeoversCodeContext || '';
    
    // Extract execution documents if available
    const documentsChecklist = params.documentsChecklist || '';
    const executionPlan = params.executionPlan || '';
    const executionTimetable = params.executionTimetable || '';
    
    // Check if this is just a general query with no regulatory context
    const isGeneralQuery = !rulesAnalysis && !documentsChecklist && !executionPlan && !executionTimetable;
    
    // If there's no specific context, generate a general response
    if (isGeneralQuery) {
      setStepProgress('Generating general response');
      
      const generalResponse = await grokService.generateResponse({
        prompt: params.query,
        maxTokens: 2000
      });
      
      const responseText = safelyExtractText(generalResponse);
      
      // Check if original input was Chinese and needs translation
      if (lastInputWasChinese) {
        setStepProgress('Translating response to Chinese');
        
        try {
          const translation = await grokService.translateContent({
            content: responseText,
            sourceLanguage: 'en',
            targetLanguage: 'zh'
          });
          
          const translatedText = safelyExtractText(translation);
          
          return {
            completed: true,
            response: responseText,
            translatedResponse: translatedText,
            requiresTranslation: true,
            metadata: generalResponse.metadata
          };
        } catch (translationError) {
          console.error('Translation error:', translationError);
          
          return {
            completed: true,
            response: responseText,
            translationError,
            requiresTranslation: true,
            metadata: generalResponse.metadata
          };
        }
      }
      
      return {
        completed: true,
        response: responseText,
        metadata: generalResponse.metadata
      };
    }
    
    // For regulatory queries, compile a structured response
    setStepProgress('Organizing structured response');
    
    // Generate a summary for the rules analysis section
    const summaryPrompt = `
Based on the following regulatory context, provide a clear analysis addressing the user's query.
Focus on explaining the relevant rules and their implications.

User Query: ${params.query}

Regulatory Context:
${rulesAnalysis}
`;

    const summaryResponse = await grokService.generateResponse({
      prompt: summaryPrompt,
      maxTokens: 2500
    });
    
    // Extract the summary text
    const summaryText = safelyExtractText(summaryResponse);
    
    // Compile the full response that references the structured sections
    let fullResponseText = summaryText;
    
    if (documentsChecklist || executionPlan || executionTimetable) {
      fullResponseText += "\n\nI've also prepared additional resources to help with your query:";
      
      if (documentsChecklist) {
        fullResponseText += "\n- A list of required documents for this transaction";
      }
      
      if (executionPlan) {
        fullResponseText += "\n- A detailed execution plan";
      }
      
      if (executionTimetable) {
        fullResponseText += "\n- A transaction timetable";
      }
      
      fullResponseText += "\n\nPlease check the sections below for these details.";
    }
    
    // Check if the response needs to be translated
    if (lastInputWasChinese) {
      setStepProgress('Translating response to Chinese');
      
      try {
        const translation = await grokService.translateContent({
          content: fullResponseText,
          sourceLanguage: 'en',
          targetLanguage: 'zh'
        });
        
        const translatedText = safelyExtractText(translation);
        
        // Structured response components are stored in metadata
        // The translated text is shown as the main response
        return {
          completed: true,
          response: fullResponseText,
          translatedResponse: translatedText,
          documentsChecklist,
          executionPlan,
          executionTimetable,
          requiresTranslation: true,
          metadata: {
            mayRequireBatching: fullResponseText.length > 3500
          }
        };
      } catch (translationError) {
        console.error('Translation error:', translationError);
        
        return {
          completed: true,
          response: fullResponseText,
          documentsChecklist,
          executionPlan,
          executionTimetable,
          translationError,
          requiresTranslation: true,
          metadata: {
            mayRequireBatching: fullResponseText.length > 3500
          }
        };
      }
    }
    
    // Return English response with structured components
    return {
      completed: true,
      response: fullResponseText,
      documentsChecklist,
      executionPlan,
      executionTimetable,
      metadata: {
        mayRequireBatching: fullResponseText.length > 3500
      }
    };
  } catch (error) {
    console.error('Error in step 5:', error);
    return { 
      completed: false,
      error
    };
  }
};
