
import { getGrokApiKey } from '../../../apiKeyService';

/**
 * Core handler for Grok API chat completions requests
 */
export const handleChatCompletions = async (requestBody: any, providedApiKey?: string): Promise<any> => {
  try {
    // Use provided key or get from storage
    const apiKey = providedApiKey || getGrokApiKey();
    
    if (!apiKey) {
      throw new Error('No API key provided for request');
    }
    
    console.log('Making Grok chat completions API request');
    
    // Use the proxy endpoint
    const response = await fetch('/api/grok/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(requestBody)
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('API request failed with status:', response.status);
      console.error('API error details:', errorText);
      throw new Error(`API request failed: ${response.status} - ${errorText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('API request error:', error);
    throw error;
  }
};
