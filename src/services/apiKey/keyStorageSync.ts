/**
 * Synchronous wrappers for API key operations
 * These provide backward compatibility by using a cache of decrypted keys
 */

import { 
  loadKeysFromStorage as asyncLoadKeys,
  saveKeysToStorage as asyncSaveKeys,
  setLegacySingleKey as asyncSetLegacyKey,
  getPerplexityApiKey as asyncGetPerplexity,
  setPerplexityApiKey as asyncSetPerplexity,
  hasPerplexityApiKey as asyncHasPerplexity,
  getGoogleApiKey as asyncGetGoogle,
  setGoogleApiKey as asyncSetGoogle,
  hasGoogleApiKey as asyncHasGoogle,
  filterValidKeys
} from './keyStorage';

// Cache for decrypted keys to provide synchronous access
let keysCache: string[] = [];
let perplexityCache: string = '';
let googleCache: string = '';
let cacheInitialized = false;

// Initialize cache on module load
const initializeCache = async () => {
  if (!cacheInitialized) {
    try {
      keysCache = await asyncLoadKeys();
      perplexityCache = await asyncGetPerplexity();
      googleCache = await asyncGetGoogle();
      cacheInitialized = true;
    } catch (error) {
      console.error('Failed to initialize key cache:', error);
    }
  }
};

// Start initialization immediately
initializeCache();

/**
 * Load API keys synchronously from cache
 */
export function loadKeysFromStorageSync(): string[] {
  if (!cacheInitialized) {
    // If cache isn't ready, try to initialize synchronously from localStorage
    // This won't decrypt but will return encrypted values that can still be validated
    try {
      const raw = localStorage.getItem('GROK_API_KEYS') || localStorage.getItem('grokApiKeys');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Could not load keys synchronously:', e);
    }
  }
  return keysCache;
}

/**
 * Save keys and update cache
 */
export async function saveKeysToStorageSync(keys: string[]): Promise<void> {
  keysCache = filterValidKeys(keys);
  await asyncSaveKeys(keys);
}

/**
 * Set single legacy key and update cache
 */
export async function setLegacySingleKeySync(key: string): Promise<void> {
  await asyncSetLegacyKey(key);
  await initializeCache(); // Refresh cache
}

/**
 * Get Perplexity key synchronously from cache
 */
export function getPerplexityApiKeySync(): string {
  return perplexityCache;
}

/**
 * Set Perplexity key and update cache
 */
export async function setPerplexityApiKeySync(key: string): Promise<void> {
  perplexityCache = key;
  await asyncSetPerplexity(key);
}

/**
 * Check if Perplexity key exists synchronously
 */
export function hasPerplexityApiKeySync(): boolean {
  return !!perplexityCache;
}

/**
 * Get Google key synchronously from cache
 */
export function getGoogleApiKeySync(): string {
  return googleCache;
}

/**
 * Set Google key and update cache
 */
export async function setGoogleApiKeySync(key: string): Promise<void> {
  googleCache = key;
  await asyncSetGoogle(key);
}

/**
 * Check if Google key exists synchronously
 */
export function hasGoogleApiKeySync(): boolean {
  return googleCache.startsWith('AIza') && googleCache.length >= 20;
}

/**
 * Refresh the cache from storage
 */
export async function refreshKeyCache(): Promise<void> {
  cacheInitialized = false;
  await initializeCache();
}

// Re-export filterValidKeys
export { filterValidKeys, DEFAULT_DEPLOYMENT_KEYS } from './keyStorage';
