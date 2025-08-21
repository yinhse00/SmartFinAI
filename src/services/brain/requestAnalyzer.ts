import { UniversalRequest } from './types';
import { AIProvider } from '@/types/aiProvider';

export class RequestAnalyzer {
  static analyzeRequest(request: UniversalRequest) {
    const analysis = {
      requestType: request.type,
      complexity: this.assessComplexity(request),
      optimalProvider: this.selectOptimalProvider(request),
      requiredContext: this.determineContextNeeds(request),
      processingStrategy: this.determineStrategy(request),
      cacheKey: this.generateCacheKey(request)
    };

    return analysis;
  }

  private static assessComplexity(request: UniversalRequest): 'low' | 'medium' | 'high' {
    const content = request.content.toLowerCase();
    const hasFiles = request.metadata.files && request.metadata.files.length > 0;
    const isLongContent = request.content.length > 1000;
    
    if (hasFiles || isLongContent || content.includes('analysis') || content.includes('complex')) {
      return 'high';
    }
    
    if (content.includes('translate') || content.includes('summarize')) {
      return 'medium';
    }
    
    return 'low';
  }

  private static selectOptimalProvider(request: UniversalRequest): AIProvider {
    // Use user preferences first
    const userDefault = request.metadata.preferences.defaultProvider;
    const featurePreference = request.metadata.preferences.perFeaturePreferences?.[request.metadata.feature];
    
    if (featurePreference) {
      return featurePreference.provider;
    }
    
    return userDefault;
  }

  private static determineContextNeeds(request: UniversalRequest): string[] {
    const needs: string[] = [];
    const content = request.content.toLowerCase();
    
    if (content.includes('regulation') || content.includes('compliance') || content.includes('law')) {
      needs.push('regulatory');
    }
    
    if (request.metadata.files) {
      needs.push('document');
    }
    
    if (content.includes('previous') || content.includes('history')) {
      needs.push('historical');
    }
    
    return needs;
  }

  private static determineStrategy(request: UniversalRequest): 'direct' | 'parallel' | 'sequential' {
    const complexity = this.assessComplexity(request);
    const hasMultipleNeeds = this.determineContextNeeds(request).length > 1;
    
    if (complexity === 'high' || hasMultipleNeeds) {
      return 'parallel';
    }
    
    if (complexity === 'medium') {
      return 'sequential';
    }
    
    return 'direct';
  }

  private static generateCacheKey(request: UniversalRequest): string {
    const keyParts = [
      request.type,
      request.metadata.feature,
      this.hashContent(request.content),
      request.metadata.preferences.defaultProvider
    ];
    
    return keyParts.join('_');
  }

  private static hashContent(content: string): string {
    // Simple hash for cache key generation
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }
}