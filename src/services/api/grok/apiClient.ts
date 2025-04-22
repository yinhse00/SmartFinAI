
import { getGrokApiKey } from '../../apiKeyService';
import { GrokChatRequestBody } from './types';
import { offlineResponseGenerator } from './offlineResponseGenerator';

// List of potential Grok API endpoints to try
const API_ENDPOINTS = [
  'https://api.grok.ai/v1/chat/completions',
  'https://grok-api.com/v1/chat/completions',
  'https://grok.x.ai/v1/chat/completions',
  'https://api.x.ai/v1/chat/completions'
];

// Local proxy endpoint if available
const LOCAL_PROXY = '/api/grok';

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
    
    // First try using the local proxy if available
    try {
      console.log("Attempting API call via local proxy");
      const proxyResponse = await fetch(LOCAL_PROXY, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify(requestBody),
        credentials: 'same-origin' as RequestCredentials
      });
      
      if (proxyResponse.ok) {
        const data = await proxyResponse.json();
        console.log("Financial expert API response received successfully via proxy");
        return data;
      } else {
        console.log("Proxy request failed with status:", proxyResponse.status);
        // Continue with direct requests
      }
    } catch (proxyError) {
      console.log("Proxy request failed:", proxyError);
      // Continue with direct requests
    }
    
    while (retries <= maxRetries) {
      try {
        // Use multiple potential API endpoints
        let response = null;
        let endpointError = null;
        
        // Create request configurations to try - proper RequestCredentials type
        const requestConfigs = [
          // Standard config with all headers
          { 
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${apiKey}`,
              'Origin': window.location.origin,
              'X-Requested-With': 'XMLHttpRequest'
            },
            body: JSON.stringify(requestBody),
            credentials: 'omit' as RequestCredentials
          },
          
          // Config with minimal headers (may help with CORS)
          { 
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify(requestBody),
            credentials: 'omit' as RequestCredentials,
            mode: 'no-cors' as RequestMode
          }
        ];
        
        // Try each endpoint with each request configuration
        for (const apiEndpoint of API_ENDPOINTS) {
          for (const requestConfig of requestConfigs) {
            try {
              console.log(`Attempting API call to: ${apiEndpoint} (config variation ${requestConfigs.indexOf(requestConfig) + 1})`);
              
              const controller = new AbortController();
              const timeoutId = setTimeout(() => controller.abort(), 10000);
              
              response = await fetch(apiEndpoint, {
                ...requestConfig,
                signal: controller.signal
              });
              
              clearTimeout(timeoutId);
              
              if (response.ok) {
                const data = await response.json();
                console.log("Financial expert API response received successfully");
                return data;
              } else {
                const errorText = await response.text();
                endpointError = new Error(`API error: ${response.status} - ${errorText}`);
                console.log(`Endpoint ${apiEndpoint} returned error: ${response.status}`);
              }
            } catch (endpointAttemptError) {
              endpointError = endpointAttemptError;
              console.log(`Endpoint ${apiEndpoint} (config ${requestConfigs.indexOf(requestConfig) + 1}) failed: ${endpointAttemptError.message}`);
            }
          }
        }
        
        throw endpointError || new Error('All API endpoints failed');
      } catch (error) {
        lastError = error;
        retries++;
        
        console.error("API call failed details:", {
          attempt: retries,
          errorType: error instanceof Error ? error.name : "Unknown",
          errorMsg: error instanceof Error ? error.message : String(error),
          isAbortError: error instanceof DOMException && error.name === "AbortError",
          isCorsError: error instanceof Error && 
            (error.message.includes('CORS') || 
             error.message.includes('Failed to fetch') ||
             error.message.includes('NetworkError'))
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
