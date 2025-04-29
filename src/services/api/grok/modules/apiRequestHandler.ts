
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
    // Add environment consistency flag to ensure same behavior in dev and production
    const enhancedRequestBody = {
      ...requestBody,
      environmentConsistency: true,
      useStableParameters: true,
      envSignature: 'unified-env-2.0',
      preserveConsistency: true
    };
    
    // Process the request through our optimized request processor
    const data = await processApiRequest(enhancedRequestBody, providedApiKey);
    
    // Track token usage and response quality
    trackApiResponseMetrics(providedApiKey || '', data);
    
    return data;
  } catch (error) {
    console.error("Financial expert API call failed:", error);
    
    // Find user message to extract prompt text
    const userMessage = requestBody.messages.find((msg: any) => msg.role === 'user');
    
    // Create prompt text for offline response
    let promptText = extractPromptText(userMessage);
    
    return offlineResponseGenerator.generateOfflineResponseFormat(promptText, error);
  }
};
