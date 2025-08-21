import { UniversalRequest, ProcessingContext } from './types';
import { contextService } from '../regulatory/contextService';

export class ContextOrchestrator {
  private static contextCache = new Map<string, { context: ProcessingContext; timestamp: number }>();
  private static readonly CACHE_TIMEOUT = 300000; // 5 minutes

  static async gatherContext(
    request: UniversalRequest,
    requiredContext: string[]
  ): Promise<ProcessingContext> {
    const cacheKey = this.generateContextCacheKey(request, requiredContext);
    
    // Check cache first
    const cached = this.getFromCache(cacheKey);
    if (cached) {
      return cached;
    }

    const context: ProcessingContext = {};
    const promises: Promise<void>[] = [];

    // Gather regulatory context if needed
    if (requiredContext.includes('regulatory')) {
      promises.push(
        this.getRegulatoryContext(request).then(regulatory => {
          context.regulatory = regulatory;
        })
      );
    }

    // Gather document context if needed
    if (requiredContext.includes('document') && request.metadata.files) {
      promises.push(
        this.getDocumentContext(request).then(document => {
          context.document = document;
        })
      );
    }

    // Gather historical context if needed
    if (requiredContext.includes('historical')) {
      promises.push(
        this.getHistoricalContext(request).then(historical => {
          context.historical = historical;
        })
      );
    }

    // Wait for all context gathering to complete
    await Promise.all(promises);

    // Cache the result
    this.storeInCache(cacheKey, context);

    return context;
  }

  private static async getRegulatoryContext(request: UniversalRequest): Promise<string> {
    try {
      return await contextService.getRegulatoryContext(request.content, {
        isPreliminaryAssessment: false,
        metadata: {
          feature: request.metadata.feature,
          useParallelProcessing: true
        }
      });
    } catch (error) {
      console.error('Error getting regulatory context:', error);
      return '';
    }
  }

  private static async getDocumentContext(request: UniversalRequest): Promise<string> {
    // This would integrate with existing file processing services
    // For now, return empty string as document processing is handled separately
    return '';
  }

  private static async getHistoricalContext(request: UniversalRequest): Promise<string> {
    // This could integrate with conversation history or previous queries
    // For now, return empty string
    return '';
  }

  private static generateContextCacheKey(request: UniversalRequest, requiredContext: string[]): string {
    const keyParts = [
      this.simpleHash(request.content),
      requiredContext.sort().join(','),
      request.metadata.feature
    ];
    return keyParts.join('_');
  }

  private static getFromCache(cacheKey: string): ProcessingContext | null {
    const cached = this.contextCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TIMEOUT) {
      return cached.context;
    }
    
    if (cached) {
      this.contextCache.delete(cacheKey);
    }
    
    return null;
  }

  private static storeInCache(cacheKey: string, context: ProcessingContext): void {
    this.contextCache.set(cacheKey, {
      context,
      timestamp: Date.now()
    });

    // Clean old cache entries periodically
    if (this.contextCache.size > 50) {
      this.cleanCache();
    }
  }

  private static cleanCache(): void {
    const now = Date.now();
    for (const [key, value] of this.contextCache.entries()) {
      if (now - value.timestamp > this.CACHE_TIMEOUT) {
        this.contextCache.delete(key);
      }
    }
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

  static clearCache(): void {
    this.contextCache.clear();
  }
}