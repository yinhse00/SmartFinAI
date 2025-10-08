import { encryptValue, decryptValue, isEncrypted } from '@/utils/encryption';

/**
 * Handles all localStorage interactions for Grok/perplexity API keys.
 * Enhanced security with encryption and proper validation
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

// Load API keys array from storage (primary, backup, else default) with decryption
export async function loadKeysFromStorage(): Promise<string[]> {
  let keys: string[] = [];
  try {
    const raw = localStorage.getItem(PRIMARY_KEYS_KEY) || localStorage.getItem(BACKUP_KEYS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        // Decrypt each key if encrypted
        const decryptedKeys = await Promise.all(
          parsed.map(async (k) => {
            if (typeof k === 'string' && isEncrypted(k)) {
              return await decryptValue(k);
            }
            return k;
          })
        );
        keys = filterValidKeys(decryptedKeys);
      }
    }
    
    // If no array keys found, try the legacy single key storage
    if (!keys.length) {
      let legacyKey = localStorage.getItem(LEGACY_SINGLE_KEY) || localStorage.getItem(LEGACY_SINGLE_KEY_BACKUP);
      if (legacyKey && isEncrypted(legacyKey)) {
        legacyKey = await decryptValue(legacyKey);
      }
      if (typeof legacyKey === 'string' && legacyKey.startsWith('xai-') && legacyKey.length >= 20) {
        keys = [legacyKey];
      }
    }
  } catch (e) {
    console.warn('Could not parse API keys from storage:', e);
  }
  
  return keys;
}

export async function saveKeysToStorage(keys: string[]) {
  const validKeys = filterValidKeys(keys);
  if (!validKeys.length) {
    console.error('Attempted to save empty or invalid key set.');
    return;
  }
  try {
    // Encrypt each key before saving
    const encryptedKeys = await Promise.all(
      validKeys.map(k => encryptValue(k))
    );
    localStorage.setItem(PRIMARY_KEYS_KEY, JSON.stringify(encryptedKeys));
    localStorage.setItem(BACKUP_KEYS_KEY, JSON.stringify(encryptedKeys));
  } catch (e) {
    console.error('Failed to save API keys:', e);
  }
}

// Single legacy key (for backwards compatibility/UI input)
export async function setLegacySingleKey(key: string): Promise<void> {
  if (typeof key !== 'string' || !key.startsWith('xai-') || key.length < 20) {
    console.error('Invalid API key format, not saving');
    return;
  }
  try {
    const encryptedKey = await encryptValue(key);
    localStorage.setItem(LEGACY_SINGLE_KEY, encryptedKey);
    localStorage.setItem(LEGACY_SINGLE_KEY_BACKUP, encryptedKey);
    
    // CRITICAL FIX: Also save to array storage to ensure grokKeyManager can access it
    const currentKeys = await loadKeysFromStorage();
    const updatedKeys = currentKeys.includes(key) ? currentKeys : [...currentKeys, key];
    await saveKeysToStorage(updatedKeys);
  } catch (error) {
    console.error('Failed to set API key in localStorage:', error);
  }
}

// Grok/Perplexity API keys for Perplexity features
export async function getPerplexityApiKey(): Promise<string> {
  const encrypted = localStorage.getItem(PERPLEXITY_KEY) || '';
  if (!encrypted) return '';
  if (isEncrypted(encrypted)) {
    return await decryptValue(encrypted);
  }
  return encrypted;
}
export async function setPerplexityApiKey(key: string): Promise<void> {
  try {
    const encrypted = await encryptValue(key);
    localStorage.setItem(PERPLEXITY_KEY, encrypted);
  } catch (e) {
    console.warn('Failed to store Perplexity API key:', e);
  }
}
export async function hasPerplexityApiKey(): Promise<boolean> {
  return !!(await getPerplexityApiKey());
}

// Google API key management
export async function getGoogleApiKey(): Promise<string> {
  const encrypted = localStorage.getItem(GOOGLE_API_KEY) || '';
  if (!encrypted) return '';
  if (isEncrypted(encrypted)) {
    return await decryptValue(encrypted);
  }
  return encrypted;
}

export async function setGoogleApiKey(key: string): Promise<void> {
  if (typeof key !== 'string' || !key.startsWith('AIza') || key.length < 20) {
    console.error('Invalid Google API key format, not saving');
    return;
  }
  try {
    const encrypted = await encryptValue(key);
    localStorage.setItem(GOOGLE_API_KEY, encrypted);
  } catch (e) {
    console.warn('Failed to store Google API key:', e);
  }
}

export async function hasGoogleApiKey(): Promise<boolean> {
  const key = await getGoogleApiKey();
  return key.startsWith('AIza') && key.length >= 20;
}
