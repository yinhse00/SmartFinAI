
import { grokService } from '@/services/grokService';
import { safelyExtractText } from '@/services/utils/responseUtils';

/**
 * Step 5: Enhanced Response Generation with optimized parameters
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
    
    // Check if this is a complex query
    const isComplexQuery = params.query.length > 150 || 
                          params.query.toLowerCase().includes('timetable') ||
                          params.query.toLowerCase().includes('rights issue');
    
    // Create quality-focused instructions with improved formatting guidance for semantic HTML
    const enhancedInstructions = `
IMPORTANT: Provide a comprehensive and thorough response. Include all relevant information with appropriate formatting.

FORMATTING GUIDELINES:
- Use semantic HTML elements for structure:
  • <h1>, <h2>, <h3> for headings instead of markdown symbols (#, ##, ###)
  • <p> tags for paragraphs with proper spacing
  • <strong> for bold/important text
  • <em> for italic/emphasized text
  • <ul> and <li> for bullet point lists
- Create clear visual separation between different sections
- Format bullet points properly with appropriate indentation
- Ensure proper spacing between paragraphs and sections
- Use tables with proper headers when presenting tabular data
- Bold key terms, rule references, and important concepts

For rules interpretation: 
- Include specific rule references with detailed explanations
- Cover all relevant requirements and implications
- For timetables, include all critical dates and explain their significance
- Use tables for clarity when appropriate
- Bold important points and rule references for emphasis

Ensure your response is complete, accurate, and addresses all aspects of the query.
`;
    
    // Quality-optimized response parameters with more reasonable token limits
    const responseParams = {
      prompt: `${params.query}\n\n${enhancedInstructions}`,
      regulatoryContext: responseContext,
      maxTokens: isComplexQuery ? 15000 : 8000, // Optimized token limits while maintaining quality
      temperature: 0.5, // Balanced temperature for better quality
      model: "grok-3-beta" // Always use the full model for user responses
    };
    
    // Generate response using Grok with quality-optimized parameters
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
