
// This is the service for the Grok AI integration

import { databaseService } from './databaseService';
import { toast } from '@/hooks/use-toast';
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
        toast({
          title: "API Key Missing",
          description: "No Grok API key provided. Using fallback response.",
          variant: "destructive",
        });
        return generateFallbackResponse(params.prompt, "No API key provided");
      }
      
      // Make API call through our proxy endpoint
      try {
        console.log("Attempting to connect to Grok API through proxy with key:", apiKey.substring(0, 5) + "...");
        
        const requestBody = JSON.stringify({
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
        });
        
        console.log("Request body:", requestBody);
        
        const response = await fetch('/api/grok/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
          },
          body: requestBody
        });
        
        console.log("Response status:", response.status);
        console.log("Response headers:", Object.fromEntries([...response.headers.entries()]));
        
        if (!response.ok) {
          const errorData = await response.text();
          console.error("Grok API error:", errorData);
          
          // If we got HTML instead of JSON, it's likely a proxy issue
          if (errorData.includes('<!DOCTYPE html>')) {
            console.error("Received HTML instead of JSON - proxy error");
            throw new Error("Proxy error: Received HTML instead of JSON");
          }
          
          throw new Error(`API error: ${response.status} - ${errorData}`);
        }
        
        // Make sure we have JSON before parsing
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          const rawText = await response.text();
          console.error("Unexpected response format:", contentType, rawText.substring(0, 200));
          throw new Error(`Unexpected response format: ${contentType}`);
        }
        
        const data = await response.json();
        console.log("Grok API response:", data);
        
        return {
          text: data.choices?.[0]?.message?.content || 
                "I'm sorry, I couldn't generate a response based on the regulatory context."
        };
      } catch (apiError) {
        console.error("Error calling Grok API:", apiError);
        
        toast({
          title: "API Error",
          description: "Error connecting to Grok API. Using fallback response.",
          variant: "destructive",
        });
        
        // For demo purposes, generate a contextual response based on the query
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
