import { supabase } from '@/integrations/supabase/client';
import { loadKeysFromStorage } from '@/services/apiKey/keyStorage';

interface SimpleAiRequest {
  prompt: string;
  metadata?: Record<string, any>;
}

interface SimpleAiResponse {
  text: string;
  success: boolean;
  error?: string;
}

/**
 * Simple AI client for IPO content generation
 * No complex sampling, temperature adjustments, or query processing
 */
export class SimpleAiClient {
  
  /**
   * Generate content using direct Grok API call with fixed parameters
   */
  async generateContent(request: SimpleAiRequest): Promise<SimpleAiResponse> {
    try {
      console.log('🤖 SimpleAiClient: Starting direct content generation');
      console.log('📝 Prompt length:', request.prompt.length);

      // Get API key from storage
      const apiKey = await this.getApiKey();
      if (!apiKey) {
        throw new Error('No API key available for content generation');
      }

      console.log('🔑 API key found, making direct request to Grok');

      // Make direct API call with fixed, simple parameters
      const response = await fetch('https://api.x.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'grok-beta',
          messages: [
            {
              role: 'user',
              content: request.prompt
            }
          ],
          // Fixed parameters - no dynamic sampling
          temperature: 0.3,
          max_tokens: 6000,
          top_p: 0.9,
          stream: false
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ API request failed:', response.status, errorText);
        throw new Error(`API request failed: ${response.status} ${errorText}`);
      }

      const data = await response.json();
      console.log('✅ API response received');

      if (!data.choices || !data.choices[0] || !data.choices[0].message) {
        console.error('❌ Invalid API response structure:', data);
        throw new Error('Invalid API response structure');
      }

      const generatedText = data.choices[0].message.content;
      console.log('📄 Generated content length:', generatedText?.length || 0);

      if (!generatedText || generatedText.trim().length === 0) {
        throw new Error('Empty response from API');
      }

      return {
        text: generatedText,
        success: true
      };

    } catch (error) {
      console.error('❌ SimpleAiClient error:', error);
      return {
        text: '',
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get API key from secure storage
   */
  private async getApiKey(): Promise<string | null> {
    try {
      // Use the existing key storage system
      const keys = loadKeysFromStorage();
      if (keys.length > 0) {
        console.log('🔑 Using API key from key storage');
        return keys[0];
      }

      console.log('❌ No API key found in storage');
      return null;
    } catch (error) {
      console.error('❌ Error getting API key:', error);
      return null;
    }
  }
}

export const simpleAiClient = new SimpleAiClient();