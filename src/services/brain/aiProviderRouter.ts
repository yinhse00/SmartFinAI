import { AIProvider } from '@/types/aiProvider';
import { UniversalRequest } from './types';
import { grokApiService } from '../api/grokApiService';
import { googleApiClient } from '../api/google/apiClient';

export class AIProviderRouter {
  private static cache = new Map<string, any>();
  
  static async routeRequest(
    request: UniversalRequest, 
    provider: AIProvider, 
    context?: string
  ): Promise<string> {
    // Check cache first
    const cacheKey = this.generateCacheKey(request, provider);
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    try {
      let response: string;
      
      switch (provider) {
        case AIProvider.GROK:
          response = await this.callGrokAPI(request, context);
          break;
        case AIProvider.GOOGLE:
          response = await this.callGoogleAPI(request, context);
          break;
        default:
          throw new Error(`Unsupported provider: ${provider}`);
      }

      // Cache successful responses
      this.cache.set(cacheKey, response);
      
      // Clean cache periodically
      if (this.cache.size > 100) {
        this.cleanCache();
      }
      
      return response;
    } catch (error) {
      console.error(`Error with provider ${provider}:`, error);
      
      // Try fallback provider only if it has an API key
      const fallbackProvider = provider === AIProvider.GROK ? AIProvider.GOOGLE : AIProvider.GROK;
      
      if (await this.hasValidApiKey(fallbackProvider)) {
        console.log(`Falling back to ${fallbackProvider}`);
        return await this.routeRequest(request, fallbackProvider, context);
      }
      
      throw new Error(`Both ${provider} and ${fallbackProvider} are unavailable`);
    }
  }

  private static async callGrokAPI(request: UniversalRequest, context?: string): Promise<string> {
    const enhancedPrompt = context ? 
      `Context:\n${context}\n\nQuery: ${request.content}` : 
      request.content;

    return await grokApiService.getRegulatoryContext(enhancedPrompt, false, {
      feature: request.metadata.feature,
      requestType: request.type
    });
  }

  private static async callGoogleAPI(request: UniversalRequest, context?: string): Promise<string> {
    const enhancedPrompt = context ? 
      `Context:\n${context}\n\nQuery: ${request.content}` : 
      request.content;

    // Use Google Gemini API for text processing
    const { getGoogleApiKey } = await import('../apiKeyService');
    const apiKey = getGoogleApiKey();
    
    if (!apiKey) {
      throw new Error('Google API key not available');
    }

    const googleRequest = {
      model: 'gemini-1.5-flash',
      contents: [{
        parts: [{ text: enhancedPrompt }]
      }],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 4096
      }
    };

    const response = await googleApiClient.callVisionAPI(googleRequest, apiKey);
    
    if (response.candidates && response.candidates[0]?.content?.parts?.[0]?.text) {
      return response.candidates[0].content.parts[0].text;
    }
    
    throw new Error('No response from Google API');
  }

  private static generateCacheKey(request: UniversalRequest, provider: AIProvider): string {
    const contentHash = this.simpleHash(request.content);
    return `${provider}_${request.type}_${contentHash}`;
  }

  private static simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(36);
  }

  private static cleanCache(): void {
    // Remove oldest entries when cache gets too large
    const entries = Array.from(this.cache.entries());
    const toRemove = entries.slice(0, 50);
    toRemove.forEach(([key]) => this.cache.delete(key));
  }

  private static async hasValidApiKey(provider: AIProvider): Promise<boolean> {
    const { hasGrokApiKey, hasGoogleApiKey } = await import('../apiKeyService');
    
    switch (provider) {
      case AIProvider.GROK:
        return hasGrokApiKey();
      case AIProvider.GOOGLE:
        return hasGoogleApiKey();
      default:
        return false;
    }
  }

  static clearCache(): void {
    this.cache.clear();
  }
}