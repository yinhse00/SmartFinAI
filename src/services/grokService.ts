// This is the service for the Grok API integration

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
      
      // Make the actual API call to Grok
      try {
        const response = await fetch('https://api.grok.ai/v1/chat/completions', {
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
            temperature: params.temperature || 0.7
          })
        });
        
        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Return the response text
        return {
          text: data.choices?.[0]?.message?.content || 
                "I'm sorry, I couldn't generate a response based on the regulatory context."
        };
      } catch (apiError) {
        console.error("Error calling Grok API:", apiError);
        
        // For demo purposes, generate a contextual response based on the query
        // This will be used if the API call fails
        return generateFallbackResponse(params.prompt);
      }
    } catch (error) {
      console.error("Error generating response:", error);
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

// Generate a fallback response if the API call fails
function generateFallbackResponse(query: string): GrokResponse {
  const lowerQuery = query.toLowerCase();
  
  if (lowerQuery.includes('rights issue') || lowerQuery.includes('timetable')) {
    return {
      text: `Based on your query about rights issues, here is my response:\n\n` +
            `A typical Rights Issue timetable for Hong Kong listed companies includes:\n\n` +
            `1. Announcement Date (Day 0): Initial announcement of the rights issue\n` +
            `2. Ex-Rights Date (Day 3-5): Shares begin trading without rights to the offering\n` +
            `3. Record Date (Day 5-7): Date to determine eligible shareholders\n` +
            `4. Prospectus Posting (Day 7-10): Rights issue documents sent to shareholders\n` +
            `5. Subscription Period (Day 10-24): 14-day period for shareholders to exercise rights\n` +
            `6. Trading of Nil-paid Rights (Day 10-20): Period when rights can be traded\n` +
            `7. Latest Time for Acceptance (Day 24): Deadline for payment and acceptance\n` +
            `8. Announcement of Results (Day 25-26): Results of the rights subscription\n` +
            `9. Refund Checks Dispatch (Day 27-28): Refunds for unsuccessful excess applications\n` +
            `10. Dealing in Fully-paid Rights (Day 28-30): New shares begin trading\n\n` +
            `This timetable follows the requirements under Chapter 7 of the Hong Kong Listing Rules.`
    };
  }
  
  if (lowerQuery.includes('takeover') || lowerQuery.includes('mandatory offer')) {
    return {
      text: `Regarding your query about takeovers, according to the Hong Kong Takeovers Code:\n\n` +
            `A mandatory general offer is triggered when:\n` +
            `- A person acquires 30% or more of voting rights in a company\n` +
            `- A person holding between 30-50% acquires more than 2% additional voting rights in any 12-month period\n\n` +
            `The offer must be made in cash or include a cash alternative at the highest price paid by the acquirer during the offer period and within 6 months prior to it.`
    };
  }
  
  // Default response for other queries
  return {
    text: `In response to your query, here is the regulatory guidance:\n\n` +
          `Based on Hong Kong financial regulations, I would recommend reviewing the following:\n\n` +
          `1. Check the relevant sections of the Securities and Futures Ordinance (SFO)\n` +
          `2. Consult HKEX Listing Rules for disclosure requirements\n` +
          `3. Review SFC guidance on compliance best practices\n\n` +
          `For more specific guidance, please provide additional details about your regulatory question.`
  };
}
