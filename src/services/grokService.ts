
// This is the service for the Grok AI integration
import { databaseService } from './databaseService';
import { hasGrokApiKey, getGrokApiKey } from './apiKeyService';
import { createEnhancedPrompt, formatRegulatoryEntriesAsContext } from './contextUtils';
import { generateFallbackResponse } from './fallbackResponseService';
import { contextService } from './regulatory/contextService';
import { grokApiService } from './api/grokApiService';
import { documentGenerationService } from './documents/documentGenerationService';
import { translationService } from './translation/translationService';

interface GrokRequestParams {
  prompt: string;
  maxTokens?: number;
  temperature?: number;
  responseFormat?: string;
  documentContext?: string;
  regulatoryContext?: string;
}

interface GrokResponse {
  text: string;
  // Add other response fields as needed based on the actual API
}

interface TranslationParams {
  content: string;
  sourceLanguage: 'en' | 'zh';
  targetLanguage: 'en' | 'zh';
  format?: string;
}

export const grokService = {
  /**
   * Check if a Grok API key is set
   */
  hasApiKey: (): boolean => {
    return hasGrokApiKey();
  },

  /**
   * Fetch relevant regulatory information for context
   */
  getRegulatoryContext: contextService.getRegulatoryContext,
  
  /**
   * Generate a response from Grok AI with regulatory context
   */
  generateResponse: async (params: GrokRequestParams): Promise<GrokResponse> => {
    try {
      // If no regulatory context was provided, try to find relevant context
      let regulatoryContext = params.regulatoryContext;
      
      // Check if the query is about rights issues or timetables
      const isRightsIssueQuery = params.prompt.toLowerCase().includes('right') && 
        (params.prompt.toLowerCase().includes('issue') || params.prompt.toLowerCase().includes('timetable'));
      
      if (!regulatoryContext) {
        if (isRightsIssueQuery) {
          console.log("Rights issue query detected, prioritizing rights issue information");
          // Force a specific search for rights issue timetable information
          regulatoryContext = await contextService.getRegulatoryContext("rights issue timetable detailed");
        } else {
          regulatoryContext = await contextService.getRegulatoryContext(params.prompt);
        }
      }
      
      // Check if we found relevant regulatory context
      const hasRelevantContext = regulatoryContext && 
                                !regulatoryContext.includes("No specific regulatory information found") &&
                                !regulatoryContext.includes("Error fetching regulatory context");
      
      // Log the context being used for debugging purposes
      console.log("Using regulatory context:", regulatoryContext);
      
      // Create an enhanced prompt that includes the regulatory context
      const enhancedPrompt = createEnhancedPrompt(params.prompt, params.documentContext, regulatoryContext);
      
      console.log("Generating response with enhanced prompt:", enhancedPrompt);
      
      const apiKey = getGrokApiKey();
      
      // Check if API key is available
      if (!apiKey) {
        console.log("No API key provided, using fallback response");
        return generateFallbackResponse(params.prompt, "No API key provided");
      }
      
      // Validate API key format (basic validation)
      if (!apiKey.startsWith('xai-')) {
        console.error("Invalid API key format");
        return generateFallbackResponse(params.prompt, "Invalid API key format");
      }
      
      try {
        console.log("Connecting to Grok API");
        
        // Create a more structured prompt that explicitly tells Grok how to use the context
        const systemMessage = hasRelevantContext 
          ? 'You are a regulatory advisor specialized in Hong Kong financial regulations. ' +
            'You MUST base your answers on the regulatory context provided to you. ' +
            'The regulatory context contains essential information to answer the user\'s question. ' +
            'If the context contains details about a timetable or process, you MUST present it in a clear, step-by-step table format. ' +
            'For timetables especially, create a formal table with dates/events and descriptions in separate columns. ' +
            'Be extremely precise and detailed, presenting information exactly as it appears in the context. ' +
            'If the context includes specific rules or article numbers, always cite them. ' +
            'If the user is asking about a rights issue timetable, you MUST format it as a clear table showing each date, event, and description ' +
            'exactly matching the information from the context provided, with no omissions.'
          : 'You are a regulatory advisor specialized in Hong Kong financial regulations. ' +
            'You should base your answers on the regulatory context provided. ' +
            'If the context doesn\'t contain relevant information to answer the question, ' +
            'clearly state that you don\'t have specific information about that topic in your reference documents.';
        
        const requestBody = {
          messages: [
            { 
              role: 'system', 
              content: systemMessage
            },
            { 
              role: 'user', 
              content: enhancedPrompt
            }
          ],
          model: "grok-3-mini-beta",
          temperature: params.temperature || 0.2, // Lowering temperature further for more precise responses
          max_tokens: params.maxTokens || 1500, // Increasing max tokens to allow for more detailed responses
          response_format: { type: "text" }
        };
        
        // Log the request body for debugging
        console.log("Request body:", JSON.stringify(requestBody));
        
        const data = await grokApiService.callChatCompletions(requestBody);
        
        const responseContent = data.choices?.[0]?.message?.content;
        
        // Check if the response seems inadequate and it's a rights issue query
        if ((responseContent?.includes("I couldn't generate a response based on the regulatory context") || 
            responseContent?.includes("No specific information") ||
            responseContent?.includes("I don't have specific information")) && 
            isRightsIssueQuery) {
          
          console.log("Received inadequate response for rights issue query, using fallback");
          return generateFallbackResponse(params.prompt, "Incomplete API response");
        }
        
        return {
          text: responseContent || 
                "I'm sorry, I couldn't generate a response based on the regulatory context."
        };
      } catch (apiError) {
        console.error("Error calling Grok API:", apiError);
        
        // Fallback to demo responses when API fails
        console.log("Using fallback response due to API error");
        return generateFallbackResponse(params.prompt, apiError instanceof Error ? apiError.message : "API error");
      }
    } catch (error) {
      console.error("Error generating response:", error);
      return generateFallbackResponse(params.prompt, "Error generating response");
    }
  },

  /**
   * Translate content using Grok AI
   */
  translateContent: translationService.translateContent,
  
  /**
   * Generate a Word document from text
   */
  generateWordDocument: documentGenerationService.generateWordDocument,

  /**
   * Generate a PDF document from text
   */
  generatePdfDocument: documentGenerationService.generatePdfDocument,

  /**
   * Generate an Excel document from text
   */
  generateExcelDocument: documentGenerationService.generateExcelDocument
};
