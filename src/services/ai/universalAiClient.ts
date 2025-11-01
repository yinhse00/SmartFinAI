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
          sessionId: request.metadata?.sessionId,
          metadata: {
            maxTokens: request.metadata?.maxTokens,
            temperature: request.metadata?.temperature,
            requestType: request.metadata?.requestType
          }
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
      
      // Provide detailed, actionable error information
      let errorMessage = 'AI service temporarily unavailable';
      let errorDetails = '';
      
      if (error instanceof Error) {
        if (error.message.includes('Monthly token limit exceeded') || error.message.includes('LIMIT_EXCEEDED')) {
          errorMessage = 'Monthly AI usage limit exceeded';
          errorDetails = 'The system AI service has reached its monthly token limit. Add your own API key in Profile settings to continue using AI features.';
        } else if (error.message.includes('disabled') || error.message.includes('API_KEY_DISABLED') || error.message.includes('403')) {
          errorMessage = 'API key is disabled';
          errorDetails = 'Your API key has been disabled. Please check console.x.ai or Google AI Studio to re-enable it, or add a new key in Profile settings.';
        } else if (error.message.includes('429') || error.message.includes('RATE_LIMIT') || error.message.includes('Rate limit')) {
          errorMessage = 'Rate limit exceeded';
          errorDetails = 'Too many requests in a short time. Please wait 30-60 seconds before trying again.';
        } else if (error.message.includes('Network') || error.message.includes('timeout')) {
          errorMessage = 'Network connection error';
          errorDetails = 'Could not reach the AI service. Please check your internet connection and try again.';
        } else if (error.message.includes('Edge function error')) {
          errorMessage = 'AI service error';
          errorDetails = 'The AI service is currently experiencing issues. Please try again in a few moments.';
        } else {
          errorMessage = error.message;
          errorDetails = 'An unexpected error occurred. Please try again or contact support if the issue persists.';
        }
      }
      
      console.error('📊 Error categorization:', { errorMessage, errorDetails });
      
      return {
        text: '',
        success: false,
        error: errorDetails || errorMessage,
        provider: request.provider,
        modelId: request.modelId
      };
    }
  }
}

export const universalAiClient = new UniversalAiClient();