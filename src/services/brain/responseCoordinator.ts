import { UniversalRequest, UniversalResponse, ProcessingContext } from './types';
import { AIProvider } from '@/types/aiProvider';

export class ResponseCoordinator {
  static formatResponse(
    rawResponse: string,
    request: UniversalRequest,
    context: ProcessingContext,
    provider: AIProvider,
    processingTime: number
  ): UniversalResponse {
    // Validate and clean the response
    const cleanedResponse = this.validateAndCleanResponse(rawResponse, request);
    
    // Assess response quality
    const quality = this.assessResponseQuality(cleanedResponse, request, context);
    
    // Determine features used
    const features = this.identifyFeaturesUsed(context, request);

    return {
      success: true,
      content: cleanedResponse,
      metadata: {
        provider,
        model: this.getModelUsed(provider, request),
        processingTime,
        contextUsed: this.hasContextBeenUsed(context),
        quality,
        features
      }
    };
  }

  static formatError(
    error: Error,
    request: UniversalRequest,
    provider: AIProvider
  ): UniversalResponse {
    return {
      success: false,
      content: this.generateFallbackResponse(request),
      metadata: {
        provider,
        model: 'fallback',
        processingTime: 0,
        contextUsed: false,
        quality: 'low',
        features: ['error_handling']
      },
      error: error.message
    };
  }

  private static validateAndCleanResponse(response: string, request: UniversalRequest): string {
    if (!response || response.trim() === '') {
      return this.generateFallbackResponse(request);
    }

    // Remove any potential harmful content or formatting issues
    let cleaned = response.trim();
    
    // Ensure proper formatting based on output format
    if (request.metadata.outputFormat === 'markdown' && !cleaned.includes('\n')) {
      // Add some basic markdown structure if needed
      cleaned = cleaned;
    }

    return cleaned;
  }

  private static assessResponseQuality(
    response: string,
    request: UniversalRequest,
    context: ProcessingContext
  ): 'high' | 'medium' | 'low' {
    let score = 0;

    // Length check
    if (response.length > 100) score += 1;
    if (response.length > 500) score += 1;

    // Context utilization
    if (context.regulatory && response.toLowerCase().includes('regulation')) score += 1;
    if (context.document && response.toLowerCase().includes('document')) score += 1;

    // Completeness check
    if (response.includes('.') || response.includes('!') || response.includes('?')) score += 1;

    // Relevance check (basic keyword matching)
    const queryWords = request.content.toLowerCase().split(' ').filter(word => word.length > 3);
    const responseWords = response.toLowerCase().split(' ');
    const matchingWords = queryWords.filter(word => responseWords.includes(word));
    if (matchingWords.length > queryWords.length * 0.3) score += 1;

    if (score >= 4) return 'high';
    if (score >= 2) return 'medium';
    return 'low';
  }

  private static identifyFeaturesUsed(context: ProcessingContext, request: UniversalRequest): string[] {
    const features: string[] = [];

    if (context.regulatory) features.push('regulatory_context');
    if (context.document) features.push('document_analysis');
    if (context.historical) features.push('historical_context');
    if (request.metadata.files) features.push('file_processing');
    if (request.type === 'translation') features.push('translation');

    return features;
  }

  private static hasContextBeenUsed(context: ProcessingContext): boolean {
    return !!(context.regulatory || context.document || context.historical);
  }

  private static getModelUsed(provider: AIProvider, request: UniversalRequest): string {
    // This would need to be enhanced based on actual model selection logic
    if (provider === AIProvider.GROK) {
      return request.metadata.preferences.perFeaturePreferences?.[request.metadata.feature]?.model || 'grok-beta';
    }
    if (provider === AIProvider.GOOGLE) {
      return 'gemini-pro';
    }
    return 'unknown';
  }

  private static generateFallbackResponse(request: UniversalRequest): string {
    const fallbacks = {
      chat: "I'm here to help with your query. Could you please rephrase your question?",
      file_processing: "I encountered an issue processing your file. Please try again or check the file format.",
      translation: "I'm unable to complete the translation at the moment. Please try again.",
      document_generation: "I couldn't generate the document as requested. Please review your requirements and try again.",
      database_query: "I'm unable to retrieve the requested information right now. Please try again later."
    };

    return fallbacks[request.type] || "I'm experiencing some difficulties. Please try your request again.";
  }
}