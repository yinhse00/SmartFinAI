
/**
 * Functions for testing direct API endpoints without using the local proxy
 */
import { API_ENDPOINTS } from '../modules/endpoints/constants';

/**
 * Test direct API endpoints with improved error handling and prioritization
 */
export const testAllDirectEndpoints = async (apiKey: string): Promise<{
  success: boolean;
  message: string;
  endpoint?: string;
}> => {
  try {
    console.log("Testing direct API endpoints...");
    
    // Based on logs, prioritize api.x.ai which appears to be working
    const prioritizedEndpoints = [
      'https://api.x.ai', 
      'https://grok.x.ai', 
      'https://api.grok.ai',
      ...API_ENDPOINTS
    ];
    
    // Filter out duplicates
    const uniqueEndpoints = [...new Set(prioritizedEndpoints)];
    
    // Test basic connectivity first
    for (const endpoint of uniqueEndpoints) {
      try {
        // First test if the endpoint is reachable at basic level
        console.log(`Testing basic connectivity to: ${endpoint}`);
        
        // Use HEAD request with no-cors for basic connectivity test
        // This should work even with CORS restrictions
        await fetch(endpoint, {
          method: 'HEAD',
          mode: 'no-cors',
          cache: 'no-store'
        });
        
        console.log(`Endpoint ${endpoint} basic connectivity test passed`);
      } catch (basicError) {
        console.warn(`Endpoint ${endpoint} connectivity test failed completely`);
        // Try next endpoint if basic connectivity fails
        continue;
      }
      
      // If we get here, the endpoint is at least reachable
      // Now try a real API call to confirm full functionality
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        
        const response = await fetch(`${endpoint}/v1/models`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache, no-store'
          },
          signal: controller.signal,
          cache: 'no-store'
        });
        
        clearTimeout(timeoutId);
        
        // Process successful response
        if (response.ok) {
          // Try to read JSON response to confirm proper API
          const data = await response.json();
          
          const modelCount = data?.data?.length || 0;
          console.log(`Direct endpoint ${endpoint} is available with ${modelCount} models`);
          
          return {
            success: true,
            message: `API connection successful via ${endpoint}`,
            endpoint
          };
        }
        
        console.warn(`Endpoint ${endpoint} returned status: ${response.status}`);
      } catch (apiError) {
        console.warn(`API call to ${endpoint} failed:`, apiError);
      }
    }
    
    // No endpoints were successful
    return {
      success: false,
      message: "All API endpoints are unreachable, check network connectivity and CORS settings"
    };
  } catch (error) {
    console.error("Direct endpoint testing failed:", error);
    return {
      success: false,
      message: error instanceof Error ? 
        `Error testing direct endpoints: ${error.message}` : 
        "Unknown error testing direct endpoints"
    };
  }
};
