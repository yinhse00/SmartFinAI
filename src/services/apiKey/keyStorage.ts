/**
 * Handles all localStorage interactions for Grok/perplexity API keys.
 * Enhanced security with proper validation and error handling
 */
const PRIMARY_KEYS_KEY = 'GROK_API_KEYS';
const BACKUP_KEYS_KEY = 'grokApiKeys';
const LEGACY_SINGLE_KEY = 'GROK_API_KEY';
const LEGACY_SINGLE_KEY_BACKUP = 'grokApiKey';
const PERPLEXITY_KEY = 'PERPLEXITY_API_KEY';
const GOOGLE_API_KEY = 'GOOGLE_API_KEY';

// No hardcoded API keys for security - use empty array as default
export const DEFAULT_DEPLOYMENT_KEYS: string[] = [];

// Validation and deduplication
export function filterValidKeys(keys: unknown): string[] {
  if (!Array.isArray(keys)) return [];
  const seen = new Set<string>();
  return keys.filter(k => typeof k === 'string' && k.startsWith('xai-') && k.length >= 20 && !seen.has(k) && !!seen.add(k));
}

// Load API keys array from storage (primary, backup, else default)
export function loadKeysFromStorage(): string[] {
  let keys: string[] = [];
  try {
    const raw = localStorage.getItem(PRIMARY_KEYS_KEY) || localStorage.getItem(BACKUP_KEYS_KEY);
    if (raw) {
      keys = filterValidKeys(JSON.parse(raw));
    }
    
    // If no array keys found, try the legacy single key storage
    if (!keys.length) {
      const legacyKey = localStorage.getItem(LEGACY_SINGLE_KEY) || localStorage.getItem(LEGACY_SINGLE_KEY_BACKUP);
      if (typeof legacyKey === 'string' && legacyKey.startsWith('xai-') && legacyKey.length >= 20) {
        keys = [legacyKey];
      }
    }
  } catch (e) {
    console.warn('Could not parse API keys from storage:', e);
  }
  
  return keys;
}

export function saveKeysToStorage(keys: string[]) {
  const validKeys = filterValidKeys(keys);
  if (!validKeys.length) {
    console.error('Attempted to save empty or invalid key set.');
    return;
  }
  try {
    localStorage.setItem(PRIMARY_KEYS_KEY, JSON.stringify(validKeys));
    localStorage.setItem(BACKUP_KEYS_KEY, JSON.stringify(validKeys));
    console.log('API keys saved to both storages.');
  } catch (e) {
    console.error('Failed to save API keys:', e);
  }
}

// Single legacy key (for backwards compatibility/UI input)
export function setLegacySingleKey(key: string): void {
  if (typeof key !== 'string' || !key.startsWith('xai-') || key.length < 20) {
    console.error('Invalid API key format, not saving');
    return;
  }
  try {
    localStorage.setItem(LEGACY_SINGLE_KEY, key);
    localStorage.setItem(LEGACY_SINGLE_KEY_BACKUP, key);
  } catch (error) {
    console.error('Failed to set API key in localStorage:', error);
  }
}

// Grok/Perplexity API keys for Perplexity features
export function getPerplexityApiKey(): string {
  return localStorage.getItem(PERPLEXITY_KEY) || '';
}
export function setPerplexityApiKey(key: string): void {
  try {
    localStorage.setItem(PERPLEXITY_KEY, key);
  } catch (e) {
    console.warn('Failed to store Perplexity API key:', e);
  }
}
export function hasPerplexityApiKey(): boolean {
  return !!getPerplexityApiKey();
}

// Google API key management
export function getGoogleApiKey(): string {
  return localStorage.getItem(GOOGLE_API_KEY) || '';
}

export function setGoogleApiKey(key: string): void {
  if (typeof key !== 'string' || !key.startsWith('AIza') || key.length < 20) {
    console.error('Invalid Google API key format, not saving');
    return;
  }
  try {
    localStorage.setItem(GOOGLE_API_KEY, key);
    console.log('Google API key saved successfully');
  } catch (e) {
    console.warn('Failed to store Google API key:', e);
  }
}

export function hasGoogleApiKey(): boolean {
  const key = getGoogleApiKey();
  return key.startsWith('AIza') && key.length >= 20;
}
