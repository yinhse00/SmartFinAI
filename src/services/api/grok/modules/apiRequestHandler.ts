
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
    const data = await processApiRequest(requestBody, providedApiKey);
    
    // Validate response format
    if (!data || (!data.choices && !data.text)) {
      console.error("API returned invalid response format:", data);
      throw new Error("Invalid API response format");
    }
    
    // Track token usage and response quality
    trackApiResponseMetrics(providedApiKey || '', data);
    
    return data;
  } catch (error) {
    console.error("Financial expert API call failed:", error);
    
    // Find user message to extract prompt text
    const userMessage = requestBody.messages.find((msg: any) => msg.role === 'user');
    
    // Create prompt text for offline response
    let promptText = extractPromptText(userMessage);
    
    // Generate offline response
    return offlineResponseGenerator.generateOfflineResponseFormat(promptText, error);
  }
};
