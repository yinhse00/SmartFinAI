
import { getGrokApiKey } from '../../apiKeyService';
import { GrokChatRequestBody } from './types';
import { offlineResponseGenerator } from './offlineResponseGenerator';

export const apiClient = {
  callChatCompletions: async (requestBody: GrokChatRequestBody, providedApiKey?: string): Promise<any> => {
    const apiKey = providedApiKey || getGrokApiKey();
    
    if (!apiKey) {
      console.error("No API key provided for financial expert access");
      throw new Error("No API key provided for financial expert access");
    }
    
    if (!apiKey.startsWith('xai-')) {
      console.error("Invalid financial expert API key format");
      throw new Error("Invalid financial expert API key format");
    }
    
    console.log("Making API call to Grok financial expert API");
    console.log("Request model:", requestBody.model);
    console.log("Temperature:", requestBody.temperature);
    console.log("Max tokens:", requestBody.max_tokens);
    console.log("Using API Key:", apiKey.substring(0, 8) + "***");

    const maxRetries = 2;
    let retries = 0;
    let lastError = null;
    
    const userPrompt = requestBody.messages.find(msg => msg.role === 'user')?.content || '';
    
    while (retries <= maxRetries) {
      try {
        const isDevelopment = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
        
        const apiEndpoints = [
          isDevelopment 
            ? 'https://api.grok.ai/v1/chat/completions'
            : 'https://api.grok.ai/v1/chat/completions',
          isDevelopment
            ? 'https://grok-api.com/v1/chat/completions'
            : 'https://grok-api.com/v1/chat/completions'
        ];
        
        let response = null;
        let endpointError = null;
        
        for (const apiEndpoint of apiEndpoints) {
          try {
            console.log(`Attempting API call to: ${apiEndpoint}`);
            
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000);
            
            response = await fetch(apiEndpoint, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
                'Origin': window.location.origin,
                'X-Requested-With': 'XMLHttpRequest'
              },
              body: JSON.stringify(requestBody),
              signal: controller.signal,
              credentials: 'omit'
            });
            
            clearTimeout(timeoutId);
            
            if (response.ok) {
              break;
            } else {
              const errorText = await response.text();
              endpointError = new Error(`API error: ${response.status} - ${errorText}`);
              console.log(`Endpoint ${apiEndpoint} returned error: ${response.status}`);
            }
          } catch (endpointAttemptError) {
            endpointError = endpointAttemptError;
            console.log(`Endpoint ${apiEndpoint} failed, trying next`);
          }
        }
        
        if (!response || !response.ok) {
          throw endpointError || new Error('All API endpoints failed');
        }
        
        const data = await response.json();
        console.log("Financial expert API response received successfully");
        return data;
      } catch (error) {
        lastError = error;
        retries++;
        
        console.error("API call failed details:", {
          attempt: retries,
          errorType: error instanceof Error ? error.name : "Unknown",
          errorMsg: error instanceof Error ? error.message : String(error),
          isAbortError: error instanceof DOMException && error.name === "AbortError"
        });
        
        if (retries <= maxRetries) {
          console.log(`Retrying in ${Math.round(Math.min(1000 * Math.pow(2, retries - 1), 8000)/1000)} seconds...`);
          const backoffTime = Math.min(1000 * Math.pow(2, retries - 1), 8000);
          await new Promise(resolve => setTimeout(resolve, backoffTime));
        } else {
          console.error("Financial expert API call failed after all retries:", error);
          return offlineResponseGenerator.generateOfflineResponseFormat(userPrompt, error);
        }
      }
    }
    
    throw lastError || new Error("API call failed after maximum retries");
  }
};

