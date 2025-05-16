
import { grokService } from '@/services/grokService';
import { safelyExtractText } from '@/services/utils/responseUtils';

/**
 * Step 5: Enhanced Response Generation with optimized response times
 */
export const executeStep5 = async (
  params: any, 
  setStepProgress: (progress: string) => void,
  lastInputWasChinese: boolean
) => {
  setStepProgress(lastInputWasChinese ? '正在生成回复' : 'Generating response');
  
  try {
    // Get combined context from all sources
    const responseContext = params.regulatoryContext || 
                           params.executionContext || 
                           params.listingRulesContext || 
                           params.takeoversCodeContext || '';
    
    // Check for missing query parameter
    if (!params.query) {
      console.error('executeStep5: Missing query in params', params);
      return { 
        completed: false,
        error: new Error("Missing query parameter"),
        response: "I couldn't process your request because the query was missing."
      };
    }
    
    // Check if streamlined processing is appropriate
    const isSimpleQuery = params.query.length < 100;
    
    // Create optimized instructions for fast response
    const enhancedInstructions = `
IMPORTANT: Be concise and direct. Focus on the most essential information. Use tables and lists for efficient formatting.

For rules interpretation: 
- Include specific rule references
- Focus on key requirements only
- For timetables, show only critical dates

BE DIRECT AND AVOID UNNECESSARY EXPLANATION.
`;
    
    // Streamlined response parameters
    const responseParams = {
      prompt: `${params.query}\n\n${enhancedInstructions}`,
      regulatoryContext: responseContext,
      maxTokens: isSimpleQuery ? 1000 : 2000, // Reduced token limits for faster responses
      temperature: 0.2
    };
    
    // Generate response using Grok with optimized parameters
    const response = await grokService.generateResponse(responseParams);
    const responseText = safelyExtractText(response);
    
    // If no response text was extracted, provide a fallback
    if (!responseText || responseText.trim() === '') {
      return {
        completed: false,
        error: new Error("No response generated"),
        response: "I'm having trouble processing your request right now. Please try again."
      };
    }
    
    // Return appropriate response based on language
    if (lastInputWasChinese) {
      return {
        completed: true,
        response: responseText,
        metadata: response.metadata,
        requiresTranslation: true
      };
    }
    
    return {
      completed: true,
      response: responseText,
      metadata: response.metadata
    };
  } catch (error) {
    console.error('Error in step 5:', error);
    return { 
      completed: false,
      error,
      response: "I encountered an error while processing your request. Please try again."
    };
  }
};
