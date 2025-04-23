import { getGrokApiKey, trackTokenUsage, getLeastUsedKey } from '../../apiKeyService';
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
const LOCAL_PROXY = '/api/grok/chat/completions';

export const apiClient = {
  callChatCompletions: async (requestBody: GrokChatRequestBody, providedApiKey?: string): Promise<any> => {
    // Use provided key, least used key, or get next key in rotation
    const apiKey = providedApiKey || getLeastUsedKey() || getGrokApiKey();
    
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
      console.log("Attempting API call via local proxy at:", LOCAL_PROXY);
      const proxyResponse = await fetch(LOCAL_PROXY, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify(requestBody)
      });
      
      if (proxyResponse.ok) {
        const data = await proxyResponse.json();
        console.log("Financial expert API response received successfully via proxy");
        return data;
      } else {
        console.warn(`Proxy request failed with status: ${proxyResponse.status}`);
        // Continue with direct requests
      }
    } catch (proxyError) {
      console.warn("Proxy request failed:", proxyError);
      // Continue with direct requests
    }
    
    // Attempt direct API calls with retries
    while (retries <= maxRetries) {
      try {
        // Try each endpoint
        for (const apiEndpoint of API_ENDPOINTS) {
          try {
            console.log(`Attempting direct API call to: ${apiEndpoint}`);
            
            const response = await fetch(apiEndpoint, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
                'Origin': window.location.origin
              },
              body: JSON.stringify(requestBody),
              mode: 'cors'
            });
            
            if (response.ok) {
              const data = await response.json();
              console.log("Financial expert API response received successfully via direct call");
              return data;
            } else {
              console.warn(`Endpoint ${apiEndpoint} returned status: ${response.status}`);
            }
          } catch (endpointError) {
            console.warn(`Endpoint ${apiEndpoint} failed:`, endpointError);
            // Continue to next endpoint
          }
        }
        
        // All endpoints failed, try next retry
        throw new Error('All API endpoints failed');
      } catch (error) {
        lastError = error;
        retries++;
        
        console.error("API call attempt failed details:", {
          attempt: retries,
          errorType: error instanceof Error ? error.name : "Unknown",
          errorMsg: error instanceof Error ? error.message : String(error)
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

    // Track token usage after successful response
    try {
      const response = await makeApiCall(apiKey, requestBody);
      if (response.usage?.total_tokens) {
        trackTokenUsage(apiKey, response.usage.total_tokens);
      }
      return response;
    } catch (error) {
      // If the error is related to token limits, try with a different key
      if (error.message?.includes('rate_limit') || error.message?.includes('quota')) {
        console.log('Token limit reached, trying different key...');
        const newKey = getGrokApiKey(); // This will get the next key in rotation
        return await apiClient.callChatCompletions(requestBody, newKey);
      }
      throw error;
    }
  }
};

// Helper function to make the actual API call
async function makeApiCall(apiKey: string, requestBody: GrokChatRequestBody) {
    try {
        // Try each endpoint
        for (const apiEndpoint of API_ENDPOINTS) {
          try {
            console.log(`Attempting direct API call to: ${apiEndpoint}`);
            
            const response = await fetch(apiEndpoint, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
                'Origin': window.location.origin
              },
              body: JSON.stringify(requestBody),
              mode: 'cors'
            });
            
            if (response.ok) {
              const data = await response.json();
              console.log("Financial expert API response received successfully via direct call");
              return data;
            } else {
              console.warn(`Endpoint ${apiEndpoint} returned status: ${response.status}`);
            }
          } catch (endpointError) {
            console.warn(`Endpoint ${apiEndpoint} failed:`, endpointError);
            // Continue to next endpoint
          }
        }
        
        // All endpoints failed, try next retry
        throw new Error('All API endpoints failed');
      } catch (error) {
        throw error;
      }
}
