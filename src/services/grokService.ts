
// This is the service for the Grok API integration
// In a production environment, you would implement proper authentication and error handling

import { databaseService, RegulatoryEntry } from './databaseService';

const GROK_API_KEY = "xai-d5jFAjxz2xujjhKYObAGbLFFGrxrM6DSUmOgQCoobSYJe6PWWgjJbgwZYJ190bAH9gniRNcMjezY4qi6";

// Note: In a real application, the API key should be stored securely on the backend 
// and not exposed in the frontend code

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
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Return a mock response for now
      return {
        text: `Based on the regulatory context and your query, here is my response:\n\n` +
              `According to the relevant sections of the Hong Kong regulations, the matter you've described ` +
              `would likely require disclosure under Chapter 14 of the Listing Rules as it appears to constitute ` +
              `a discloseable transaction based on the size tests. The following steps should be taken:\n\n` +
              `1. Calculate the relevant percentage ratios under Rule 14.07\n` +
              `2. Make an announcement as soon as possible after terms are finalized\n` +
              `3. Include all information required under Rule 14.58 in the announcement\n\n` +
              `This response is based on the specific regulatory context provided.`
      };
      
      // In a real implementation, it would look more like:
      /*
      const response = await fetch('https://api.grok.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${GROK_API_KEY}`
        },
        body: JSON.stringify({
          model: 'grok-1',
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
          max_tokens: params.maxTokens || 500,
          temperature: params.temperature || 0.7,
          response_format: { type: params.responseFormat || 'text' }
        })
      });
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      return await response.json();
      */
    } catch (error) {
      console.error("Error calling Grok API:", error);
      throw new Error("Failed to generate response from Grok API.");
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

// Helper function to format regulatory entries as context
function formatRegulatoryEntriesAsContext(entries: RegulatoryEntry[]): string {
  return entries.map(entry => (
    `--- ${entry.title} (${entry.source}) ---\n` +
    `${entry.content}\n`
  )).join('\n\n');
}

// Helper function to create an enhanced prompt with context
function createEnhancedPrompt(prompt: string, documentContext?: string, regulatoryContext?: string): string {
  let enhancedPrompt = prompt;
  
  if (documentContext) {
    enhancedPrompt = 
      `Document Context:\n${documentContext}\n\n` +
      `Query: ${prompt}`;
  }
  
  if (regulatoryContext) {
    enhancedPrompt = 
      `Regulatory Context:\n${regulatoryContext}\n\n` +
      `${enhancedPrompt}`;
  }
  
  return enhancedPrompt;
}
