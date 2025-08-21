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
 * Default preferences for Google provider
 */
const GOOGLE_DEFAULT_PREFERENCES: UserAIPreferences = {
  defaultProvider: AIProvider.GOOGLE,
  defaultModel: 'gemini-2.0-flash',
  perFeaturePreferences: {
    chat: { provider: AIProvider.GOOGLE, model: 'gemini-2.0-flash' },
    ipo: { provider: AIProvider.GOOGLE, model: 'gemini-2.0-flash' },
    translation: { provider: AIProvider.GOOGLE, model: 'gemini-2.0-flash' }
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
      
      // Migrate deprecated models
      const migratedPreferences = migrateDeprecatedModels(parsed);
      
      // Choose base defaults based on provider
      const baseDefaults = migratedPreferences.defaultProvider === AIProvider.GOOGLE 
        ? GOOGLE_DEFAULT_PREFERENCES 
        : DEFAULT_PREFERENCES;
      
      // Merge with defaults to ensure all properties exist
      return {
        ...baseDefaults,
        ...migratedPreferences,
        perFeaturePreferences: {
          ...baseDefaults.perFeaturePreferences,
          ...migratedPreferences.perFeaturePreferences
        }
      };
    }
  } catch (error) {
    console.warn('Error loading AI preferences:', error);
  }
  
  return DEFAULT_PREFERENCES;
}

/**
 * Migrate deprecated models to current ones
 */
function migrateDeprecatedModels(preferences: any): UserAIPreferences {
  const migrated = { ...preferences };
  
  // Migrate deprecated gemini-pro to gemini-2.0-flash
  if (migrated.defaultModel === 'gemini-pro') {
    migrated.defaultModel = 'gemini-2.0-flash';
  }
  
  if (migrated.perFeaturePreferences) {
    Object.keys(migrated.perFeaturePreferences).forEach(feature => {
      const pref = migrated.perFeaturePreferences[feature];
      if (pref && pref.model === 'gemini-pro') {
        pref.model = 'gemini-2.0-flash';
      }
    });
  }
  
  return migrated;
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