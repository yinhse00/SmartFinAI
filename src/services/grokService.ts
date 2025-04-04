
// This is the service for the Grok AI integration

import { databaseService } from './databaseService';
import { getGrokApiKey, hasGrokApiKey } from './apiKeyService';
import { createEnhancedPrompt, formatRegulatoryEntriesAsContext } from './contextUtils';
import { generateFallbackResponse } from './fallbackResponseService';

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
  getRegulatoryContext: async (query: string): Promise<string> => {
    try {
      // Search the database for relevant entries
      const relevantEntries = await databaseService.search(query);
      
      if (relevantEntries.length === 0) {
        return "No specific regulatory information found in database.";
      }
      
      // Format the entries as context
      return formatRegulatoryEntriesAsContext(relevantEntries);
    } catch (error) {
      console.error("Error fetching regulatory context:", error);
      return "Error fetching regulatory context.";
    }
  },
  
  /**
   * Generate a response from Grok AI with regulatory context
   */
  generateResponse: async (params: GrokRequestParams): Promise<GrokResponse> => {
    try {
      // If no regulatory context was provided, try to find relevant context
      let regulatoryContext = params.regulatoryContext;
      if (!regulatoryContext) {
        regulatoryContext = await grokService.getRegulatoryContext(params.prompt);
      }
      
      // Create an enhanced prompt that includes the regulatory context
      const enhancedPrompt = createEnhancedPrompt(params.prompt, params.documentContext, regulatoryContext);
      
      console.log("Generating response with enhanced prompt:", enhancedPrompt);
      
      const apiKey = getGrokApiKey();
      
      // Check if API key is available
      if (!apiKey) {
        console.log("No API key provided, using fallback response");
        return generateFallbackResponse(params.prompt, "No API key provided");
      }
      
      try {
        console.log("Connecting to Grok API");
        
        const requestBody = {
          messages: [
            { 
              role: 'system', 
              content: 'You are a regulatory advisor specialized in Hong Kong financial regulations. ' +
                       'Use the provided regulatory context to generate accurate responses.' 
            },
            { 
              role: 'user', 
              content: enhancedPrompt
            }
          ],
          model: "grok-2",
          temperature: params.temperature || 0.7,
          max_tokens: params.maxTokens || 500
        };
        
        console.log("Request body:", JSON.stringify(requestBody));
        
        // Use a proxy endpoint to avoid CORS issues
        const response = await fetch('/api/grok/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
          },
          body: JSON.stringify(requestBody)
        });
        
        if (!response.ok) {
          const errorData = await response.text();
          console.error(`API error ${response.status}:`, errorData);
          throw new Error(`API error: ${response.status}`);
        }
        
        const data = await response.json();
        return {
          text: data.choices?.[0]?.message?.content || 
                "I'm sorry, I couldn't generate a response based on the regulatory context."
        };
      } catch (apiError) {
        console.error("Error calling Grok API:", apiError);
        
        // Fallback to demo responses when API fails
        console.log("Using fallback response due to API error");
        return generateFallbackResponse(params.prompt, "API error");
      }
    } catch (error) {
      console.error("Error generating response:", error);
      return generateFallbackResponse(params.prompt, "Error generating response");
    }
  },
  
  /**
   * Generate a Word document from text
   * In a real implementation, this would call a backend service that creates a Word document
   */
  generateWordDocument: async (content: string): Promise<Blob> => {
    try {
      // This is a placeholder. In a real implementation, you would:
      // 1. Call a backend endpoint that generates a Word document
      // 2. Return the document as a Blob
      
      console.log("Generating Word document with content:", content);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Return a mock blob
      // In a real implementation, this would be an actual Word document
      return new Blob(['Mock Word document content'], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
    } catch (error) {
      console.error("Error generating Word document:", error);
      throw new Error("Failed to generate Word document.");
    }
  }
};
