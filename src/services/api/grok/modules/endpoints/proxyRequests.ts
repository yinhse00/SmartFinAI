
/**
 * Enhanced handler for proxy API requests with better HTML detection
 */
import { LOCAL_PROXY, TIMEOUTS } from './constants';
import { offlineResponseGenerator } from '../../../grok/offlineResponseGenerator';

/**
 * Attempt API call using local proxy with improved CORS handling
 */
export const attemptProxyRequest = async (
  requestBody: any, 
  apiKey: string
): Promise<any> => {
  console.log("Attempting API call via local proxy at:", LOCAL_PROXY);
  
  try {
    // First try a lightweight ping to check if proxy is responsive
    try {
      await fetch(`${LOCAL_PROXY}/ping`, {
        method: 'HEAD',
        mode: 'no-cors',
        cache: 'no-store'
      });
      console.log("Proxy ping successful, proceeding with request");
    } catch (pingError) {
      console.warn("Proxy ping failed, but still attempting full request");
    }
    
    // Use AbortController for better timeout handling
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
      console.warn("Proxy request timed out after 30 seconds");
    }, TIMEOUTS.PROXY_REQUEST);
    
    const proxyResponse = await fetch(LOCAL_PROXY, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'X-Request-Source': 'browser-client', 
        'X-Request-ID': `req-${Date.now()}`, // Add request ID for tracing
        'Cache-Control': 'no-store, no-cache' // Strengthen cache prevention
      },
      body: JSON.stringify(requestBody),
      signal: controller.signal,
      cache: 'no-store', // Prevent caching
      mode: 'cors' // Ensure CORS mode is explicitly set
    });
    
    clearTimeout(timeoutId);
    
    if (proxyResponse.ok) {
      // Check content type to identify HTML responses
      const contentType = proxyResponse.headers.get('content-type');
      const isLikelyJsonResponse = !contentType || contentType.includes('application/json');
      
      // Read response as text first for inspection
      const responseText = await proxyResponse.text();
      
      // Detect if this is actually HTML despite the Content-Type
      const isHtmlResponse = responseText.includes('<!DOCTYPE html>') || 
                           responseText.includes('<html') ||
                           responseText.includes('</body>');
      
      if (isHtmlResponse) {
        console.error("Proxy returned HTML instead of JSON (likely CORS issue)");
        const htmlSnippet = responseText.substring(0, 100) + "...";
        console.error("HTML response snippet:", htmlSnippet);
        
        // Generate an informative offline response
        const userMessage = requestBody.messages?.find((msg: any) => msg.role === 'user')?.content || "unknown query";
        const corsError = new Error("CORS policy restriction - received HTML instead of JSON");
        return offlineResponseGenerator.generateOfflineResponseFormat(userMessage, corsError);
      }
      
      // If response looks like JSON but Content-Type isn't, log it but continue
      if (!isLikelyJsonResponse) {
        console.warn(`Proxy returned non-JSON content type: ${contentType}`);
      }
      
      // Try to parse as JSON
      try {
        const data = JSON.parse(responseText);
        console.log("Proxy request successful with JSON response");
        return data;
      } catch (jsonError) {
        console.error("Failed to parse proxy response as JSON:", jsonError);
        
        // Generate an offline response with better error information
        const userMessage = requestBody.messages?.find((msg: any) => msg.role === 'user')?.content || "unknown query";
        const parseError = new Error(`Invalid JSON response from proxy: ${jsonError.message}`);
        return offlineResponseGenerator.generateOfflineResponseFormat(userMessage, parseError);
      }
    }
    
    // Handle error responses by providing more context
    try {
      const errorText = await proxyResponse.text();
      
      // Check for HTML error pages which indicate CORS issues
      if (errorText.includes('<!DOCTYPE html>') || errorText.includes('<html')) {
        console.warn(`Proxy returned HTML error page with status: ${proxyResponse.status}`);
        throw new Error(`Proxy returned HTML error page with status: ${proxyResponse.status} (likely CORS issue)`);
      }
      
      console.warn(`Proxy request failed with status: ${proxyResponse.status}`, errorText.substring(0, 200));
      throw new Error(`Proxy request failed with status: ${proxyResponse.status} - ${errorText.substring(0, 100)}`);
    } catch (textError) {
      // If we can't read the error text, just use the status
      console.warn(`Proxy request failed with status: ${proxyResponse.status}`);
      throw new Error(`Proxy request failed with status: ${proxyResponse.status}`);
    }
  } catch (error) {
    // Better error handling with specific messages for different error types
    if (error instanceof DOMException && error.name === 'AbortError') {
      console.error("Proxy request timed out");
      throw new Error("Proxy request timed out - server may be overloaded");
    } else if (error instanceof TypeError && error.message.includes('fetch')) {
      console.error("Network error during proxy request - likely CORS or connectivity issue");
      throw new Error("Network error - check your internet connection and proxy configuration");
    }
    
    console.warn("Proxy request error:", error);
    throw error;
  }
};
