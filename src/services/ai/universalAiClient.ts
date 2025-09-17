import { AIProvider, AIRequest, AIResponse } from '@/types/aiProvider';
import { getProviderConfig, getModelConfig } from '@/config/aiModels';
import { supabase } from '@/integrations/supabase/client';

/**
 * Universal AI client that supports multiple providers via system-owned API keys
 */
export class UniversalAiClient {

  /**
   * Generate content using system-owned API keys via Edge Function
   */
  async generateContent(request: AIRequest): Promise<AIResponse> {
    try {
      console.log(`🤖 UniversalAiClient: Starting generation with ${request.provider}/${request.modelId}`);
      console.log('📝 Prompt length:', request.prompt.length);

      // Get provider configuration for validation
      const providerConfig = getProviderConfig(request.provider);
      if (!providerConfig) {
        throw new Error(`Unsupported provider: ${request.provider}`);
      }

      // Get model configuration for validation
      const modelConfig = getModelConfig(request.provider, request.modelId);
      if (!modelConfig) {
        throw new Error(`Model ${request.modelId} not found for provider ${request.provider}`);
      }

      console.log(`🚀 Calling universal AI proxy for ${request.provider}`);

      // Call universal AI proxy Edge Function
      const { data, error } = await supabase.functions.invoke('universal-ai-proxy', {
        body: {
          provider: request.provider,
          model: request.modelId,
          prompt: request.prompt,
          feature: request.metadata?.feature,
          sessionId: request.metadata?.sessionId
        }
      });

      if (error) {
        console.error('❌ Universal AI Proxy error:', error);
        throw new Error(error.message || 'Edge function error');
      }

      if (!data || !data.success) {
        console.error('❌ Universal AI Proxy returned unsuccessful response:', data);
        throw new Error(data?.error || 'AI service returned unsuccessful response');
      }

      console.log('✅ Generation completed successfully via system API');
      
      return {
        text: data.text || '',
        success: true,
        error: undefined,
        provider: request.provider,
        modelId: request.modelId
      };
    } catch (error) {
      console.error('❌ UniversalAiClient error:', error);
      
      // Provide more detailed error information
      let errorMessage = 'AI service temporarily unavailable';
      if (error instanceof Error) {
        if (error.message.includes('Monthly token limit exceeded')) {
          errorMessage = 'AI service has reached its monthly usage limit. Please try again later.';
        } else if (error.message.includes('Edge function error')) {
          errorMessage = 'AI service is currently experiencing issues. Please try again.';
        } else {
          errorMessage = error.message;
        }
      }
      
      return {
        text: '',
        success: false,
        error: errorMessage,
        provider: request.provider,
        modelId: request.modelId
      };
    }
  }
}

export const universalAiClient = new UniversalAiClient();