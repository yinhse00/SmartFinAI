
/**
 * Core API request handler with enhanced CORS and error handling
 */
import { offlineResponseGenerator } from '../offlineResponseGenerator';
import { processApiRequest } from './requestProcessor';
import { trackApiResponseMetrics } from './responseTracker';
import { extractPromptText } from './requestHelper';

// Track failed requests to provide better fallbacks
let failedRequestCount = 0;
const MAX_CONSECUTIVE_FAILURES = 3;
let lastFailureTime = 0;
const FAILURE_RESET_TIME = 60000; // 1 minute

/**
 * Core function to handle Grok API requests with comprehensive error handling
 * and adaptive fallback strategy for CORS issues
 */
export const handleChatCompletions = async (requestBody: any, providedApiKey?: string): Promise<any> => {
  try {
    // Reset failure count if enough time has passed
    if (Date.now() - lastFailureTime > FAILURE_RESET_TIME) {
      failedRequestCount = 0;
    }

    // If we've had too many consecutive failures, go to offline mode faster
    if (failedRequestCount >= MAX_CONSECUTIVE_FAILURES) {
      console.warn(`Too many consecutive API failures (${failedRequestCount}), using offline mode`);
      
      const userMessage = requestBody.messages.find((msg: any) => msg.role === 'user');
      const promptText = extractPromptText(userMessage);
      
      return offlineResponseGenerator.generateOfflineResponseFormat(
        promptText, 
        new Error("API service is temporarily unreachable due to connection issues")
      );
    }
    
    // Process the request through our optimized request processor
    const data = await processApiRequest(requestBody, providedApiKey);
    
    // Track token usage and response quality
    trackApiResponseMetrics(providedApiKey || '', data);
    
    // Reset failure count on success
    failedRequestCount = 0;
    
    return data;
  } catch (error) {
    console.error("Financial expert API call failed:", error);
    
    // Increment failure counter and record time
    failedRequestCount++;
    lastFailureTime = Date.now();
    
    // Extract CORS-related information for better diagnostics
    const errorMessage = error instanceof Error ? error.message : String(error);
    const isCorsError = 
      errorMessage.includes('CORS') || 
      errorMessage.includes('cross-origin') ||
      errorMessage.includes('Access-Control-Allow-Origin');
    
    if (isCorsError) {
      console.error("CORS error detected - this is likely a browser security restriction");
      console.error("Details:", errorMessage);
      
      // Add specific CORS error information to the offline response
      const userMessage = requestBody.messages.find((msg: any) => msg.role === 'user');
      const promptText = extractPromptText(userMessage);
      
      return offlineResponseGenerator.generateOfflineResponseFormat(
        promptText,
        new Error(`CORS restriction encountered: ${errorMessage}. Try using the local proxy.`)
      );
    }
    
    // Find user message to extract prompt text
    const userMessage = requestBody.messages.find((msg: any) => msg.role === 'user');
    
    // Create prompt text for offline response
    let promptText = extractPromptText(userMessage);
    
    return offlineResponseGenerator.generateOfflineResponseFormat(promptText, error);
  }
};
