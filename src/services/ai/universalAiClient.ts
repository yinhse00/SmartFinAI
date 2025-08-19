import { AIProvider, AIRequest, AIResponse } from '@/types/aiProvider';
import { getModelConfig } from '@/config/aiModels';
import { loadKeysFromStorage, getGoogleApiKey } from '@/services/apiKey/keyStorage';

/**
 * Universal AI client that supports multiple providers (Grok and Google)
 */
export class UniversalAiClient {

  /**
   * Generate content using the specified AI provider and model
   */
  async generateContent(request: AIRequest): Promise<AIResponse> {
    try {
      console.log(`🤖 UniversalAiClient: Starting generation with ${request.provider}/${request.modelId}`);
      console.log('📝 Prompt length:', request.prompt.length);

      const modelConfig = getModelConfig(request.provider, request.modelId);
      if (!modelConfig) {
        throw new Error(`Model configuration not found for ${request.provider}/${request.modelId}`);
      }

      // Get API key for the provider
      const apiKey = await this.getApiKey(request.provider);
      if (!apiKey) {
        throw new Error(`No API key available for ${request.provider}`);
      }

      console.log(`🔑 API key found for ${request.provider}, making request`);

      // Route to appropriate provider
      let response: AIResponse;
      switch (request.provider) {
        case AIProvider.GROK:
          response = await this.callGrokAPI(request, modelConfig, apiKey);
          break;
        case AIProvider.GOOGLE:
          response = await this.callGoogleAPI(request, modelConfig, apiKey);
          break;
        default:
          throw new Error(`Unsupported provider: ${request.provider}`);
      }

      console.log('✅ Generation completed successfully');
      return response;

    } catch (error) {
      console.error('❌ UniversalAiClient error:', error);
      return {
        text: '',
        success: false,
        error: error.message,
        provider: request.provider,
        modelId: request.modelId
      };
    }
  }

  /**
   * Call Grok API (OpenAI-compatible format)
   */
  private async callGrokAPI(request: AIRequest, modelConfig: any, apiKey: string): Promise<AIResponse> {
    const response = await fetch(modelConfig.apiEndpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: request.modelId,
        messages: [
          {
            role: 'user',
            content: request.prompt
          }
        ],
        temperature: modelConfig.defaultTemperature,
        max_tokens: Math.min(6000, modelConfig.maxTokens),
        top_p: 0.9,
        stream: false
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Grok API request failed:', response.status, errorText);
      throw new Error(`Grok API request failed: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      console.error('❌ Invalid Grok API response structure:', data);
      throw new Error('Invalid Grok API response structure');
    }

    const generatedText = data.choices[0].message.content;
    
    if (!generatedText || generatedText.trim().length === 0) {
      throw new Error('Empty response from Grok API');
    }

    return {
      text: generatedText,
      success: true,
      provider: AIProvider.GROK,
      modelId: request.modelId
    };
  }

  /**
   * Call Google Gemini API (native format)
   */
  private async callGoogleAPI(request: AIRequest, modelConfig: any, apiKey: string): Promise<AIResponse> {
    const endpoint = `${modelConfig.apiEndpoint}/${request.modelId}:generateContent`;
    
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-goog-api-key': apiKey,
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: request.prompt
              }
            ]
          }
        ],
        generationConfig: {
          temperature: modelConfig.defaultTemperature,
          maxOutputTokens: Math.min(6000, modelConfig.maxTokens),
          topP: 0.9
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Google API request failed:', response.status, errorText);
      throw new Error(`Google API request failed: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    
    if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
      console.error('❌ Invalid Google API response structure:', data);
      throw new Error('Invalid Google API response structure');
    }

    const generatedText = data.candidates[0].content.parts[0].text;
    
    if (!generatedText || generatedText.trim().length === 0) {
      throw new Error('Empty response from Google API');
    }

    return {
      text: generatedText,
      success: true,
      provider: AIProvider.GOOGLE,
      modelId: request.modelId
    };
  }

  /**
   * Get API key for the specified provider
   */
  private async getApiKey(provider: AIProvider): Promise<string | null> {
    try {
      switch (provider) {
        case AIProvider.GROK:
          const grokKeys = loadKeysFromStorage();
          if (grokKeys.length > 0) {
            console.log('🔑 Using Grok API key from storage');
            return grokKeys[0];
          }
          break;
        case AIProvider.GOOGLE:
          const googleKey = getGoogleApiKey();
          if (googleKey && googleKey.startsWith('AIza') && googleKey.length >= 20) {
            console.log('🔑 Using Google API key from storage');
            return googleKey;
          }
          break;
      }
      
      console.log(`❌ No valid API key found for ${provider}`);
      return null;
    } catch (error) {
      console.error(`❌ Error getting API key for ${provider}:`, error);
      return null;
    }
  }
}

export const universalAiClient = new UniversalAiClient();