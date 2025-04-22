
import { getGrokApiKey } from '../../apiKeyService';

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
      // 1. First try using credentials: 'omit' to avoid preflight CORS issues
      // 2. Then try a simpler HEAD request to test basic connectivity
      // 3. Finally, attempt a simplified version of the actual API call
      
      // Track which test passes for better diagnostics
      let connectivityTestPassed = false;
      let corsTestPassed = false;
      let apiTestPassed = false;
      
      // First test: Basic connectivity with HEAD request (less CORS issues)
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        
        const headResponse = await fetch('https://api.grok.ai', {
          method: 'HEAD',
          signal: controller.signal,
          credentials: 'omit', // Avoid CORS preflight
          mode: 'no-cors'     // Try with no-cors mode
        });
        
        clearTimeout(timeoutId);
        connectivityTestPassed = true;
        console.log("Basic connectivity test passed");
      } catch (connectivityError) {
        console.log("Basic connectivity test failed:", connectivityError);
        // We'll continue with other tests even if this fails
      }
      
      // Second test: Simple OPTIONS request to check CORS configuration
      if (connectivityTestPassed) {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 5000);
          
          const corsResponse = await fetch('https://api.grok.ai/v1/chat/completions', {
            method: 'OPTIONS',
            signal: controller.signal,
            headers: {
              'Origin': window.location.origin
            },
            credentials: 'omit'
          });
          
          clearTimeout(timeoutId);
          corsTestPassed = true;
          console.log("CORS preflight test passed");
        } catch (corsError) {
          console.log("CORS preflight test failed:", corsError);
        }
      }
      
      // Final test: Actual API call with minimal payload
      if (connectivityTestPassed) {
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
          
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 5000);
          
          const response = await fetch('https://api.grok.ai/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${key}`,
              'Origin': window.location.origin,
              'Accept': 'application/json'
            },
            body: JSON.stringify(testRequest),
            signal: controller.signal,
            credentials: 'omit'
          });
          
          clearTimeout(timeoutId);
          
          if (response.ok) {
            apiTestPassed = true;
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
        }
      }
      
      // Return appropriate diagnostic message based on which tests passed
      if (!connectivityTestPassed) {
        return {
          success: false,
          message: "Cannot establish basic connectivity to Grok API. This may indicate network issues or firewall restrictions."
        };
      } else if (!corsTestPassed) {
        return {
          success: false,
          message: "Basic connectivity available, but CORS preflight failed. The API may be restricting access from this origin."
        };
      } else if (!apiTestPassed) {
        return {
          success: false,
          message: "API authentication failed. The API key may be invalid or expired."
        };
      }
      
      // Fallback message if we reached this point
      return {
        success: false,
        message: "Connection tests failed. See console for detailed error logs."
      };
    } catch (error) {
      console.error("API connection test failed:", error);
      return {
        success: false,
        message: error instanceof Error ? error.message : String(error)
      };
    }
  }
};
