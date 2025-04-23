
/**
 * Handles all localStorage interactions for Grok/perplexity API keys.
 */
const PRIMARY_KEYS_KEY = 'GROK_API_KEYS';
const BACKUP_KEYS_KEY = 'grokApiKeys';
const LEGACY_SINGLE_KEY = 'GROK_API_KEY';
const LEGACY_SINGLE_KEY_BACKUP = 'grokApiKey';
const PERPLEXITY_KEY = 'PERPLEXITY_API_KEY';

export const DEFAULT_DEPLOYMENT_KEYS = [
  'xai-VDZl0d1KOqa1a6od7PwcSJa8H6voWmnmPo1P97ElrW2JHHD7pF3kFxm7Ii5Or6SdhairQkgBlQ1zOci3',
  'xai-wqG2hD4YSmX3mQtjr43pCeg8CCnvU9O2AEE73CTSEchgELJRDDgIdmcvZCCqB8N5T0Y00YhSCmtKBXMO',
  'xai-backup1KeyHere',
  'xai-backup2KeyHere',
  'xai-7h1uCveS6tzIywYV6DS8fjVk49mMuggoG0usLyEV03iODdadLZojWQJhlttKw1UpXAXAHg29l7G5ZDLb',
  'xai-C3YiE8RYzsdK4eMJBGLKRzMR3gmBAABkvcinl6rvgpeMsiONgHLqmIp2C7gy77It6sTVrCHV5gb0Mtb1'
];

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
  } catch (e) {
    console.warn('Could not parse API keys from storage:', e);
  }
  if (!keys.length) {
    keys = [...DEFAULT_DEPLOYMENT_KEYS];
    try {
      localStorage.setItem(PRIMARY_KEYS_KEY, JSON.stringify(keys));
      localStorage.setItem(BACKUP_KEYS_KEY, JSON.stringify(keys));
    } catch (e) {
      console.warn('Failed to set default deployment keys', e);
    }
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

