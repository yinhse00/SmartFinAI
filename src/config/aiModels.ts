import { AIProvider, AIModel, AIProviderConfig } from '@/types/aiProvider';

/**
 * Grok models configuration
 */
export const GROK_MODELS: AIModel[] = [
  {
    provider: AIProvider.GROK,
    modelId: 'grok-4-0709',
    displayName: 'Grok 4 (Latest)',
    maxTokens: 25000,
    apiEndpoint: 'https://api.x.ai/v1/chat/completions',
    defaultTemperature: 0.3,
    capabilities: ['text', 'reasoning', 'analysis', 'creativity', 'ipo-generation']
  },
  {
    provider: AIProvider.GROK,
    modelId: 'grok-3-mini-beta',
    displayName: 'Grok 3 Mini (Fast)',
    maxTokens: 8000,
    apiEndpoint: 'https://api.x.ai/v1/chat/completions',
    defaultTemperature: 0.3,
    capabilities: ['text', 'translation', 'simple-tasks']
  }
];

/**
 * Google Gemini models configuration
 */
export const GOOGLE_MODELS: AIModel[] = [
  {
    provider: AIProvider.GOOGLE,
    modelId: 'gemini-2.0-flash',
    displayName: 'Gemini 2.0 Flash (Latest)',
    maxTokens: 1048576,
    apiEndpoint: 'https://generativelanguage.googleapis.com/v1beta/models',
    defaultTemperature: 0.4,
    capabilities: ['text', 'reasoning', 'analysis', 'vision', 'multilingual', 'ipo-generation']
  }
];

/**
 * Provider configurations
 */
export const AI_PROVIDERS: AIProviderConfig[] = [
  {
    provider: AIProvider.GROK,
    apiKeyPrefix: 'xai-',
    storageKey: 'GROK_API_KEYS',
    displayName: 'Grok (X.AI)',
    models: GROK_MODELS
  },
  {
    provider: AIProvider.GOOGLE,
    apiKeyPrefix: 'AIza',
    storageKey: 'GOOGLE_API_KEY',
    displayName: 'Google Gemini',
    models: GOOGLE_MODELS
  }
];

/**
 * Get all available models
 */
export function getAllModels(): AIModel[] {
  return [...GROK_MODELS, ...GOOGLE_MODELS];
}

/**
 * Get models for a specific provider
 */
export function getModelsForProvider(provider: AIProvider): AIModel[] {
  const providerConfig = AI_PROVIDERS.find(p => p.provider === provider);
  return providerConfig?.models || [];
}

/**
 * Get specific model configuration
 */
export function getModelConfig(provider: AIProvider, modelId: string): AIModel | undefined {
  const models = getModelsForProvider(provider);
  return models.find(m => m.modelId === modelId);
}

/**
 * Get default model for provider
 */
export function getDefaultModel(provider: AIProvider): AIModel | undefined {
  const models = getModelsForProvider(provider);
  return models[0]; // First model is default
}

/**
 * Get provider configuration
 */
export function getProviderConfig(provider: AIProvider): AIProviderConfig | undefined {
  return AI_PROVIDERS.find(p => p.provider === provider);
}

/**
 * Validate API key format for provider
 */
export function validateApiKey(provider: AIProvider, apiKey: string): boolean {
  const config = getProviderConfig(provider);
  if (!config) return false;
  
  return apiKey.startsWith(config.apiKeyPrefix) && apiKey.length >= 20;
}