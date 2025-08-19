export enum AIProvider {
  GROK = 'grok',
  GOOGLE = 'google'
}

export interface AIModel {
  provider: AIProvider;
  modelId: string;
  displayName: string;
  maxTokens: number;
  apiEndpoint: string;
  defaultTemperature: number;
  capabilities: string[];
}

export interface AIProviderConfig {
  provider: AIProvider;
  apiKeyPrefix: string;
  storageKey: string;
  displayName: string;
  models: AIModel[];
}

export interface AIRequest {
  prompt: string;
  provider: AIProvider;
  modelId: string;
  metadata?: Record<string, any>;
}

export interface AIResponse {
  text: string;
  success: boolean;
  error?: string;
  provider: AIProvider;
  modelId: string;
}

export interface UserAIPreferences {
  defaultProvider: AIProvider;
  defaultModel: string;
  perFeaturePreferences?: {
    chat?: { provider: AIProvider; model: string };
    ipo?: { provider: AIProvider; model: string };
    translation?: { provider: AIProvider; model: string };
  };
}