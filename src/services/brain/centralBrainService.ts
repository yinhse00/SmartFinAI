import { UniversalRequest, UniversalResponse, BrainConfig } from './types';
import { RequestAnalyzer } from './requestAnalyzer';
import { AIProviderRouter } from './aiProviderRouter';
import { ContextOrchestrator } from './contextOrchestrator';
import { ResponseCoordinator } from './responseCoordinator';

export class CentralBrainService {
  private static config: BrainConfig = {
    enableCaching: true,
    cacheTimeout: 300000, // 5 minutes
    fallbackProvider: 'grok' as any,
    maxRetries: 2,
    parallelProcessing: true
  };

  static async processRequest(request: UniversalRequest): Promise<UniversalResponse> {
    const startTime = Date.now();
    
    try {
      console.log('CentralBrain: Processing request', { type: request.type, feature: request.metadata.feature });

      // Step 1: Analyze the request
      const analysis = RequestAnalyzer.analyzeRequest(request);
      console.log('CentralBrain: Request analysis', analysis);

      // Step 2: Gather required context
      const context = await ContextOrchestrator.gatherContext(request, analysis.requiredContext);
      console.log('CentralBrain: Context gathered', { hasRegulatory: !!context.regulatory });

      // Step 3: Combine context into a single string for AI processing
      const combinedContext = this.combineContext(context);

      // Step 4: Route to appropriate AI provider
      const rawResponse = await AIProviderRouter.routeRequest(
        request,
        analysis.optimalProvider,
        combinedContext
      );

      // Step 5: Format and coordinate the response
      const processingTime = Date.now() - startTime;
      const finalResponse = ResponseCoordinator.formatResponse(
        rawResponse,
        request,
        context,
        analysis.optimalProvider,
        processingTime
      );

      console.log('CentralBrain: Request completed', { 
        success: finalResponse.success, 
        processingTime,
        quality: finalResponse.metadata.quality 
      });

      return finalResponse;

    } catch (error) {
      console.error('CentralBrain: Error processing request', error);
      
      const processingTime = Date.now() - startTime;
      return ResponseCoordinator.formatError(
        error as Error,
        request,
        request.metadata.preferences.defaultProvider
      );
    }
  }

  private static combineContext(context: any): string {
    const parts: string[] = [];

    if (context.regulatory) {
      parts.push(`Regulatory Context:\n${context.regulatory}`);
    }

    if (context.document) {
      parts.push(`Document Context:\n${context.document}`);
    }

    if (context.historical) {
      parts.push(`Historical Context:\n${context.historical}`);
    }

    return parts.join('\n\n');
  }

  // Utility methods for adapters
  static async processChat(content: string, metadata: any): Promise<UniversalResponse> {
    const request: UniversalRequest = {
      type: 'chat',
      content,
      metadata: {
        feature: 'chat',
        preferences: {
          defaultProvider: metadata.preferences.provider,
          defaultModel: metadata.preferences.model,
          perFeaturePreferences: {}
        },
        ...metadata
      }
    };

    return this.processRequest(request);
  }

  static async processFileAnalysis(content: string, files: File[], metadata: any): Promise<UniversalResponse> {
    const request: UniversalRequest = {
      type: 'file_processing',
      content,
      metadata: {
        feature: 'file_processing',
        files,
        preferences: {
          defaultProvider: metadata.preferences.provider,
          defaultModel: metadata.preferences.model,
          perFeaturePreferences: {}
        },
        ...metadata
      }
    };

    return this.processRequest(request);
  }

  static async processTranslation(content: string, metadata: any): Promise<UniversalResponse> {
    const request: UniversalRequest = {
      type: 'translation',
      content,
      metadata: {
        feature: 'translation',
        preferences: {
          defaultProvider: metadata.preferences.provider,
          defaultModel: metadata.preferences.model,
          perFeaturePreferences: {}
        },
        ...metadata
      }
    };

    return this.processRequest(request);
  }

  static async processDocumentGeneration(content: string, metadata: any): Promise<UniversalResponse> {
    const request: UniversalRequest = {
      type: 'document_generation',
      content,
      metadata: {
        feature: 'document_generation',
        preferences: {
          defaultProvider: metadata.preferences.provider,
          defaultModel: metadata.preferences.model,
          perFeaturePreferences: {}
        },
        outputFormat: 'markdown',
        ...metadata
      }
    };

    return this.processRequest(request);
  }

  static async processDatabaseQuery(content: string, metadata: any): Promise<UniversalResponse> {
    const request: UniversalRequest = {
      type: 'database_query',
      content,
      metadata: {
        feature: 'database',
        preferences: {
          defaultProvider: metadata.preferences.provider,
          defaultModel: metadata.preferences.model,
          perFeaturePreferences: {}
        },
        ...metadata
      }
    };

    return this.processRequest(request);
  }

  // Configuration management
  static updateConfig(newConfig: Partial<BrainConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  static getConfig(): BrainConfig {
    return { ...this.config };
  }

  // Cache management
  static clearAllCaches(): void {
    AIProviderRouter.clearCache();
    ContextOrchestrator.clearCache();
  }
}