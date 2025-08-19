import { AIProvider, UserAIPreferences } from '@/types/aiProvider';

const AI_PREFERENCES_KEY = 'ai_preferences';

/**
 * Default AI preferences
 */
const DEFAULT_PREFERENCES: UserAIPreferences = {
  defaultProvider: AIProvider.GROK,
  defaultModel: 'grok-4-0709',
  perFeaturePreferences: {
    chat: { provider: AIProvider.GROK, model: 'grok-4-0709' },
    ipo: { provider: AIProvider.GROK, model: 'grok-4-0709' },
    translation: { provider: AIProvider.GROK, model: 'grok-3-mini-beta' }
  }
};

/**
 * Get user AI preferences from localStorage
 */
export function getAIPreferences(): UserAIPreferences {
  try {
    const stored = localStorage.getItem(AI_PREFERENCES_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      // Merge with defaults to ensure all properties exist
      return {
        ...DEFAULT_PREFERENCES,
        ...parsed,
        perFeaturePreferences: {
          ...DEFAULT_PREFERENCES.perFeaturePreferences,
          ...parsed.perFeaturePreferences
        }
      };
    }
  } catch (error) {
    console.warn('Error loading AI preferences:', error);
  }
  
  return DEFAULT_PREFERENCES;
}

/**
 * Save user AI preferences to localStorage
 */
export function saveAIPreferences(preferences: UserAIPreferences): void {
  try {
    localStorage.setItem(AI_PREFERENCES_KEY, JSON.stringify(preferences));
    console.log('AI preferences saved successfully');
  } catch (error) {
    console.error('Error saving AI preferences:', error);
  }
}

/**
 * Get AI preference for a specific feature
 */
export function getFeatureAIPreference(feature: 'chat' | 'ipo' | 'translation'): { provider: AIProvider; model: string } {
  const preferences = getAIPreferences();
  return preferences.perFeaturePreferences?.[feature] || {
    provider: preferences.defaultProvider,
    model: preferences.defaultModel
  };
}

/**
 * Update AI preference for a specific feature
 */
export function updateFeatureAIPreference(
  feature: 'chat' | 'ipo' | 'translation',
  provider: AIProvider,
  model: string
): void {
  const preferences = getAIPreferences();
  
  if (!preferences.perFeaturePreferences) {
    preferences.perFeaturePreferences = {};
  }
  
  preferences.perFeaturePreferences[feature] = { provider, model };
  saveAIPreferences(preferences);
}

/**
 * Update default AI preference
 */
export function updateDefaultAIPreference(provider: AIProvider, model: string): void {
  const preferences = getAIPreferences();
  preferences.defaultProvider = provider;
  preferences.defaultModel = model;
  saveAIPreferences(preferences);
}