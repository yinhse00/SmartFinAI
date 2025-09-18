import { supabase } from '@/integrations/supabase/client';
import { loadKeysFromStorage } from '@/services/apiKey/keyStorage';
import { universalAiClient } from '@/services/ai/universalAiClient';
import { AIProvider, AIRequest } from '@/types/aiProvider';
import { getFeatureAIPreference } from '@/services/ai/aiPreferences';

interface SimpleAiRequest {
  prompt: string;
  metadata?: Record<string, any>;
  provider?: AIProvider;
  modelId?: string;
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
   * Generate content using Universal AI client with provider selection
   */
  async generateContent(request: SimpleAiRequest): Promise<SimpleAiResponse> {
    try {
      console.log('🤖 SimpleAiClient: Starting content generation with provider selection');
      console.log('📝 Prompt length:', request.prompt.length);

      // Get AI preferences for IPO feature
      const preference = getFeatureAIPreference('ipo');
      
      // Use provided provider/model or fall back to preferences
      const provider = request.provider || preference.provider;
      const modelId = request.modelId || preference.model;

      console.log(`🎯 Using AI provider: ${provider}/${modelId}`);

      // Create universal AI request
      const aiRequest: AIRequest = {
        prompt: request.prompt,
        provider,
        modelId,
        metadata: request.metadata
      };

      // Use universal AI client
      const response = await universalAiClient.generateContent(aiRequest);

      console.log('✅ Universal AI response received');
      console.log('📄 Generated content length:', response.text?.length || 0);

      if (!response.success || !response.text || response.text.trim().length === 0) {
        const errorMsg = response.error || 'Empty response from AI service';
        console.error('❌ AI service returned unsuccessful response:', { success: response.success, error: response.error, textLength: response.text?.length });
        throw new Error(errorMsg);
      }

      return {
        text: response.text,
        success: true
      };

    } catch (error) {
      console.error('❌ SimpleAiClient error:', error);
      
      // Provide specific error messages based on error type
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
        error: errorMessage
      };
    }
  }

  /**
   * Generate content with specific provider (for backward compatibility)
   */
  async generateContentWithProvider(
    request: SimpleAiRequest, 
    provider: AIProvider, 
    modelId: string
  ): Promise<SimpleAiResponse> {
    return this.generateContent({
      ...request,
      provider,
      modelId
    });
  }
}

export const simpleAiClient = new SimpleAiClient();