
import { GrokRequestParams, GrokResponse } from '@/types/grok';
import { responseGeneratorCore } from '../core/responseGeneratorCore';
import { hashUtils } from '../utils/hashUtils';

/**
 * Handles simple conversational queries without complex regulatory context
 */
export const conversationalQueryHandler = {
  /**
   * Process a simple conversational query
   */
  processQuery: async (
    params: GrokRequestParams, 
    apiKey: string, 
    requestId: string,
    isProduction: boolean
  ): Promise<GrokResponse | null> => {
    console.log('Processing simple conversational query with streamlined approach');
    
    // Create simplified system message for conversational queries
    const conversationalSystemMessage = 
      "You are a helpful virtual assistant with expertise in Hong Kong financial regulations. " +
      "For simple conversational queries, provide direct and concise responses while maintaining " +
      "a professional tone. If the user asks about your capabilities, explain that you specialize " +
      "in Hong Kong financial regulations, listing rules, and corporate actions. " +
      "CRITICAL: Always provide IDENTICAL responses in all environments when receiving the same input.";
    
    try {
      // Build simple request body for conversational queries
      const requestBody = {
        messages: [
          { role: 'system', content: conversationalSystemMessage },
          { role: 'user', content: params.prompt }
        ],
        model: "grok-3-mini-beta",
        temperature: 0.05, // Use extremely low temperature for consistency
        max_tokens: 4000,
        environmentConsistency: true,
        requestId: requestId,
        envSignature: 'unified-env-2.0',
        useStableParameters: true,
        seed: hashUtils.createSimpleHash(params.prompt || '') // Use consistent seed
      };
      
      // Make API call with simpler configuration for conversational queries
      const response = await responseGeneratorCore.makeApiCall(requestBody, apiKey);
      
      // FIX: Add comprehensive null checks for response and choices
      // Access content safely with proper null checking
      let responseText = '';
      if (response && 
          response.choices && 
          Array.isArray(response.choices) && 
          response.choices.length > 0 && 
          response.choices[0] && // Add explicit check for first item
          response.choices[0].message) {
        responseText = response.choices[0].message.content || '';
      }
      
      return {
        text: responseText,
        queryType: 'conversational',
        metadata: {
          contextUsed: false,
          relevanceScore: 1.0,
          environmentInfo: {
            requestId,
            isProduction,
            envSignature: 'unified-env-2.0'
          }
        }
      };
    } catch (error) {
      console.error("Error in conversational API call:", error);
      return null; // Return null to indicate error and allow fallback
    }
  }
};
