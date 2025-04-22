
import { createFinancialExpertSystemPrompt } from '../../financial/systemPrompts';
import { responseOptimizer } from '../modules/responseOptimizer';

/**
 * Builds appropriate API requests based on query type and context
 */
export const requestBuilder = {
  /**
   * Build a system message based on query characteristics
   */
  buildSystemMessage: (
    queryType: string, 
    regulatoryContext?: string, 
    isFaqQuery: boolean = false
  ): string => {
    // Create a professional financial system message based on expertise area
    let systemMessage = createFinancialExpertSystemPrompt(queryType, regulatoryContext);
    
    // Add stronger instructions to use database content
    systemMessage += "\n\nCRITICAL INSTRUCTION: You MUST prioritize information from the regulatory database over your general knowledge. When regulatory guidance exists in the provided database content, use it verbatim. If the database contains an answer to the question, quote it directly rather than generating your own response. Only use your general knowledge when the database has no relevant information.";
    
    // For FAQ queries, add specific instructions to use the exact wording from the database
    if (isFaqQuery) {
      systemMessage += "\n\nIMPORTANT: For questions related to FAQs or continuing obligations, ONLY use the exact wording from the provided database entries. DO NOT paraphrase, summarize or use your own knowledge. Extract the relevant FAQ question and answer from the '10.4 FAQ Continuing Obligations' document and provide them verbatim. If no exact match is found, explicitly state that.";
    }
    
    // Add special instruction for completeness and brevity to avoid truncation
    systemMessage += "\n\nCRITICAL: Ensure your response is COMPLETE and not truncated. Be CONCISE and direct. Prioritize including all key points over lengthy explanations. If discussing a procedure with multiple steps, include ALL steps but explain each briefly. Format information efficiently. Focus on providing complete information rather than verbose explanations.";
    
    return systemMessage;
  },

  /**
   * Build request body for API call
   */
  buildRequestBody: (
    systemMessage: string,
    prompt: string,
    temperature: number,
    maxTokens: number
  ): any => {
    // Add instruction for completeness to the prompt
    const enhancedPrompt = prompt + " Please provide a complete but concise response covering all key points.";
    
    return {
      messages: [
        { role: 'system', content: systemMessage },
        { role: 'user', content: enhancedPrompt }
      ],
      model: "grok-3-mini-beta",
      temperature: temperature,
      // Use conservative token limit to ensure completeness
      max_tokens: Math.min(maxTokens, 2000),
    };
  },

  /**
   * Get optimized parameters for the request
   */
  getOptimizedParameters: (
    queryType: string, 
    prompt: string, 
    hasContext: boolean,
    isSimpleQuery: boolean = false
  ): { temperature: number, maxTokens: number } => {
    // Use simpler parameters for conversational queries
    if (isSimpleQuery && !hasContext) {
      return {
        temperature: 0.3,
        maxTokens: 1500 // Reduced from 2000
      };
    }
    
    // Get optimized parameters from the optimizer service
    const { temperature, maxTokens } = responseOptimizer.getOptimizedParameters(queryType, prompt);
    
    // Use lower temperature for database-backed queries
    const actualTemperature = hasContext ? 0.1 : temperature;
    
    // Ensure token count is within safe limits to avoid truncation
    const safeMaxTokens = Math.min(2000, maxTokens); // Reduced from 3500
    
    return { temperature: actualTemperature, maxTokens: safeMaxTokens };
  }
};
