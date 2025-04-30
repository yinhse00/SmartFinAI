
/**
 * Tests API connection availability and provides diagnostics
 */
import { areAllEndpointsFailing, getNextAvailableEndpoint, markEndpointAsFailing } from './modules/endpointRotator';
import { LOCAL_PROXY, BASE_ENDPOINTS } from './modules/endpoints/config';
import { checkApiAvailability } from './modules/endpoints/availabilityChecker';

/**
 * Test API connection to the financial expert API
 * Enhanced with better diagnostics and recovery mechanisms
 */
export const connectionTester = {
  testApiConnection: async (apiKey?: string): Promise<{ success: boolean; message: string; diagnostics?: any }> => {
    if (!apiKey || !apiKey.startsWith('xai-') || apiKey.length < 20) {
      return {
        success: false,
        message: "Invalid API key format. Key must start with 'xai-' and be at least 20 characters."
      };
    }
  
    console.log("Testing Grok API connection...");
    
    // Test the API availability
    try {
      // First try the proxy endpoint to see if it's working
      try {
        console.log("Testing proxy endpoint...");
        
        // Use AbortController for timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000);
        
        const proxyResponse = await fetch(`${LOCAL_PROXY.split('/chat')[0]}/models`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Accept': 'application/json'
          },
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (proxyResponse.ok) {
          try {
            const data = await proxyResponse.json();
            console.log("Proxy endpoint test successful");
            
            return {
              success: true,
              message: "API connection established via proxy endpoint."
            };
          } catch (jsonError) {
            console.warn("Proxy returned invalid JSON:", jsonError);
            // Continue to next test
          }
        } else {
          console.warn("Proxy test failed with status:", proxyResponse.status);
        }
      } catch (proxyError) {
        console.warn("Proxy test error:", proxyError);
        // Continue to direct endpoint tests
      }
      
      // If proxy test fails, try direct endpoints
      const endpoint = getNextAvailableEndpoint();
      console.log(`Testing direct endpoint: ${endpoint}`);
      
      try {
        // Use AbortController for timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000);
        
        const response = await fetch(endpoint.replace('/chat/completions', '/models'), {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Accept': 'application/json'
          },
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (response.ok) {
          console.log("Direct endpoint test successful");
          return {
            success: true,
            message: "API connection established via direct endpoint."
          };
        } else {
          console.warn("Direct endpoint test failed with status:", response.status);
          markEndpointAsFailing(endpoint);
        }
      } catch (directError) {
        console.warn("Direct endpoint test error:", directError);
        markEndpointAsFailing(endpoint);
        
        // Try a no-cors HEAD request to check if the server is reachable at all
        try {
          const baseEndpoint = endpoint.split('/v1')[0];
          await fetch(baseEndpoint, { method: 'HEAD', mode: 'no-cors' });
          
          console.log("Server is reachable but likely has CORS restrictions");
          return {
            success: true,
            message: "API server is reachable, but may have CORS restrictions. Use proxy for best results."
          };
        } catch (headError) {
          console.warn("Server is completely unreachable:", headError);
        }
      }
      
      // Check if all endpoints are failing
      if (areAllEndpointsFailing()) {
        return {
          success: false,
          message: "All API endpoints are currently unreachable. This may be due to network issues or API service outage."
        };
      }
      
      return {
        success: false,
        message: "Could not connect to API. The API may be down, or there may be network/CORS issues."
      };
      
    } catch (error) {
      console.error("API connection test failed:", error);
      
      return {
        success: false,
        message: error instanceof Error ? error.message : "Unknown error during API connection test",
        diagnostics: {
          errorType: error instanceof Error ? error.name : typeof error,
          timestamp: new Date().toISOString()
        }
      };
    }
  }
};
