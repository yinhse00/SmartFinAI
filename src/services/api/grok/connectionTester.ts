
import { getGrokApiKey } from '../../apiKeyService';

// List of potential API endpoints to test
const TEST_ENDPOINTS = [
  'https://api.grok.ai',
  'https://grok-api.com',
  'https://grok.x.ai',
  'https://api.x.ai'
];

export const connectionTester = {
  testApiConnection: async (apiKey?: string): Promise<{success: boolean, message: string}> => {
    try {
      console.log("Testing Grok API connection...");
      const key = apiKey || getGrokApiKey();
      
      if (!key || !key.startsWith('xai-')) {
        return {
          success: false,
          message: "Invalid API key format. Keys should start with 'xai-'"
        };
      }
      
      // We'll use a more sophisticated test approach:
      // 1. Try multiple endpoints with simple HEAD requests
      // 2. If those succeed, try an actual minimal API call
      
      // Track which test passes for better diagnostics
      let connectivityTestPassed = false;
      let endpointsTested = 0;
      let workingEndpoint = null;
      
      // First test: Try multiple endpoints with basic requests
      for (const endpoint of TEST_ENDPOINTS) {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 5000);
          
          console.log(`Testing endpoint: ${endpoint}`);
          const headResponse = await fetch(endpoint, {
            method: 'HEAD',
            signal: controller.signal,
            credentials: 'omit' as RequestCredentials,
            mode: 'no-cors'
          });
          
          clearTimeout(timeoutId);
          connectivityTestPassed = true;
          workingEndpoint = endpoint;
          console.log(`Endpoint ${endpoint} connectivity test successful`);
          break; // Found a working endpoint
        } catch (endpointError) {
          console.log(`Endpoint ${endpoint} connectivity test failed:`, endpointError);
          endpointsTested++;
        }
      }
      
      if (!connectivityTestPassed) {
        console.log(`All ${endpointsTested} endpoints failed basic connectivity test`);
        return {
          success: false,
          message: "Cannot establish connectivity with any Grok API endpoints. This may indicate network issues, CORS restrictions, or firewall settings."
        };
      }
      
      // Final test: Actual API call with minimal payload
      try {
        const testRequest = {
          messages: [
            { role: 'system', content: 'Test.' },
            { role: 'user', content: 'Test.' }
          ],
          model: "grok-3-mini-beta",
          temperature: 0.1,
          max_tokens: 5
        };
        
        const apiEndpoint = `${workingEndpoint}/v1/chat/completions`;
        console.log(`Testing actual API call to: ${apiEndpoint}`);
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        
        const response = await fetch(apiEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${key}`,
            'Origin': window.location.origin,
            'Accept': 'application/json'
          },
          body: JSON.stringify(testRequest),
          signal: controller.signal,
          credentials: 'omit' as RequestCredentials
        });
        
        clearTimeout(timeoutId);
        
        if (response.ok) {
          console.log("Full API test passed");
          return {
            success: true,
            message: "API connection successful"
          };
        } else {
          const errorText = await response.text();
          return {
            success: false,
            message: `API error: ${response.status} - ${errorText}`
          };
        }
      } catch (apiError) {
        console.error("API test failed:", apiError);
        return {
          success: false,
          message: `Basic connectivity established but API call failed: ${apiError instanceof Error ? apiError.message : 'Unknown error'}`
        };
      }
    } catch (error) {
      console.error("API connection test failed:", error);
      return {
        success: false,
        message: error instanceof Error ? error.message : String(error)
      };
    }
  }
};
