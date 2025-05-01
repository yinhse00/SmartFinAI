
/**
 * Core API request handler
 */
import { offlineResponseGenerator } from '../offlineResponseGenerator';
import { processApiRequest } from './requestProcessor';
import { trackApiResponseMetrics } from './responseTracker';
import { extractPromptText } from './requestHelper';

/**
 * Core function to handle Grok API requests with comprehensive error handling
 */
export const handleChatCompletions = async (requestBody: any, providedApiKey?: string): Promise<any> => {
  try {
    // Process the request through our optimized request processor
    const data = await processApiRequest(
      '/v1/chat/completions',
      'POST',
      requestBody,
      providedApiKey || ''
    );
    
    // Enhanced validation with more specific error messages
    if (!data) {
      console.error("API returned empty response");
      throw new Error("API returned empty response");
    }
    
    // Check for choices array (standard OpenAI format)
    if (!data.choices && !data.text) {
      // Try to log the structure of what we received to help debug
      console.error("API returned invalid response format:", 
        typeof data === 'object' ? Object.keys(data).join(', ') : typeof data);
      throw new Error("Invalid API response format: missing 'choices' and 'text'");
    }
    
    // For choices array, ensure there's at least one choice with a message
    if (data.choices && (!Array.isArray(data.choices) || data.choices.length === 0)) {
      console.error("API returned empty choices array:", data);
      throw new Error("Invalid API response: empty 'choices' array");
    }
    
    // If using choices format, validate the first choice has a message with content
    if (data.choices && (!data.choices[0].message || typeof data.choices[0].message.content !== 'string')) {
      console.error("API response missing message content in first choice:", data.choices[0]);
      throw new Error("Invalid API response: missing message content");
    }
    
    // Track token usage and response quality
    trackApiResponseMetrics(providedApiKey || '', data);
    
    return data;
  } catch (error) {
    console.error("Financial expert API call failed:", error);
    
    // Find user message to extract prompt text
    const userMessage = requestBody.messages?.find((msg: any) => msg.role === 'user');
    
    // Create prompt text for offline response using helper function
    let promptText = userMessage ? extractPromptText(userMessage) : "unknown query";
    
    // Generate offline response with detailed error information
    const offlineResponse = offlineResponseGenerator.generateOfflineResponseFormat(promptText, error);
    console.warn("Using offline response due to API failure");
    return offlineResponse;
  }
};
