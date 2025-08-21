import { AIProvider } from '@/types/aiProvider';

export interface UniversalRequest {
  type: 'chat' | 'file_processing' | 'translation' | 'document_generation' | 'database_query';
  content: string;
  metadata: {
    userId?: string;
    feature: string;
    preferences: {
      defaultProvider: AIProvider;
      defaultModel: string;
      perFeaturePreferences?: Record<string, { provider: AIProvider; model: string }>;
    };
    context?: any;
    files?: File[];
    outputFormat?: 'text' | 'markdown' | 'json' | 'html';
    language?: string;
  };
}

export interface UniversalResponse {
  success: boolean;
  content: string;
  metadata: {
    provider: AIProvider;
    model: string;
    processingTime: number;
    contextUsed: boolean;
    quality: 'high' | 'medium' | 'low';
    features: string[];
  };
  error?: string;
}

export interface ProcessingContext {
  regulatory?: string;
  document?: string;
  historical?: string;
  cache?: Record<string, any>;
}

export interface BrainConfig {
  enableCaching: boolean;
  cacheTimeout: number;
  fallbackProvider: AIProvider;
  maxRetries: number;
  parallelProcessing: boolean;
}