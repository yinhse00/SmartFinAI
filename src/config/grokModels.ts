/**
 * Centralized Grok model configuration
 */
export const GROK_MODELS = {
  // Primary model for main processing
  PRIMARY: 'grok-4-0709',
  
  // Secondary model for lightweight tasks
  SECONDARY: 'grok-3-mini-beta',
  
  // Legacy models (deprecated)
  LEGACY_PRIMARY: 'grok-3-beta',
} as const;

/**
 * Model capabilities and token limits
 */
export const MODEL_CONFIG = {
  [GROK_MODELS.PRIMARY]: {
    maxTokens: 25000,
    defaultTemperature: 0.5,
    capabilities: ['text', 'reasoning', 'analysis'],
    description: 'Latest Grok model with enhanced capabilities'
  },
  [GROK_MODELS.SECONDARY]: {
    maxTokens: 8000,
    defaultTemperature: 0.3,
    capabilities: ['text', 'translation'],
    description: 'Lightweight model for simple tasks'
  }
} as const;

/**
 * Get the appropriate model for a given task type
 */
export function getModelForTask(taskType: 'primary' | 'secondary' | 'translation' = 'primary'): string {
  switch (taskType) {
    case 'translation':
    case 'secondary':
      return GROK_MODELS.SECONDARY;
    case 'primary':
    default:
      return GROK_MODELS.PRIMARY;
  }
}

/**
 * Get model configuration
 */
export function getModelConfig(model: string) {
  return MODEL_CONFIG[model as keyof typeof MODEL_CONFIG];
}