
/**
 * API key validation functionality
 */
import { getGrokApiKey } from '../../../apiKeyService';

/**
 * Test if an API key is valid and has sufficient quota
 */
export const testApiKeyValidity = async (apiKey: string): Promise<{isValid: boolean, message: string, quotaRemaining?: number}> => {
  try {
    // Simple test query to validate the key
    const testBody = {
      messages: [
        { role: 'user', content: 'Respond with the word "valid" only' }
      ],
      model: "grok-3-mini-beta",
      temperature: 0.1,
      max_tokens: 10
    };
    
    const response = await fetch('/api/grok/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(testBody)
    });
    
    if (response.ok) {
      // Get headers to check for quota/rate limit information
      const rateLimit = response.headers.get('x-ratelimit-remaining') || 
                      response.headers.get('x-rate-limit-remaining');
      
      const quotaRemaining = rateLimit ? parseInt(rateLimit, 10) : undefined;
      
      return {
        isValid: true,
        message: "API key is valid and working",
        quotaRemaining
      };
    } else {
      const errorData = await response.json().catch(() => ({}));
      
      if (response.status === 401) {
        return {
          isValid: false,
          message: "Invalid API key or authorization failed"
        };
      } else if (response.status === 429) {
        return {
          isValid: true, // Key is valid but rate limited
          message: "API key rate limit exceeded. Try again later.",
          quotaRemaining: 0
        };
      } else {
        return {
          isValid: false,
          message: `API error: ${errorData.error?.message || response.statusText || 'Unknown error'}`
        };
      }
    }
  } catch (error) {
    console.error("API key validation test failed:", error);
    return {
      isValid: false,
      message: error instanceof Error ? error.message : String(error)
    };
  }
};

/**
 * Validates if API key has correct format
 */
export const validateApiKeyFormat = (apiKey?: string): boolean => {
  return Boolean(apiKey && apiKey.startsWith('xai-'));
};
