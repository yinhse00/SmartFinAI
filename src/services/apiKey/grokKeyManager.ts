
/**
 * Main orchestration for Grok API key pool, selection/rotation, and legacy compat.
 */
import { 
  loadKeysFromStorage, 
  saveKeysToStorage, 
  filterValidKeys, 
  setLegacySingleKey, 
  DEFAULT_DEPLOYMENT_KEYS,
  getPerplexityApiKey, 
  setPerplexityApiKey, 
  hasPerplexityApiKey,
} from './keyStorage';

import {
  trackTokenUsage,
  trackResponseQuality,
  getLeastUsedKey,
  getBestPerformingKey,
  getLastTruncatedKey,
  clearUsage
} from './keyUsageTracker';

let currentKeyIndex = 0;

/**
 * Advanced round-robin key rotation with load balancing
 * Returns the next available API key using a circular pattern
 */
export function getGrokApiKey(): string {
  try {
    const keys = loadKeysFromStorage();
    if (!keys.length) throw new Error('No available API keys in storage or defaults.');
    
    // Improved round-robin rotation
    currentKeyIndex = (currentKeyIndex + 1) % keys.length;
    const selectedKey = keys[currentKeyIndex];
    
    console.log(`Rotating API key: using key ${currentKeyIndex + 1} of ${keys.length}`);
    return selectedKey;
  } catch (error) {
    console.error('Error accessing API keys:', error);
    return DEFAULT_DEPLOYMENT_KEYS[0];
  }
}

/**
 * Get a key that hasn't been used recently, especially for fresh requests
 * This helps spread the load across all available keys
 */
export function getFreshGrokApiKey(): string {
  try {
    const keys = loadKeysFromStorage();
    if (!keys.length) throw new Error('No available API keys in storage or defaults.');

    // Filter out the last key that had truncation recently
    const freshKeys = keys.filter(key => key !== getLastTruncatedKey());
    
    // If we have multiple keys, use a random selection to distribute load
    const keyPool = freshKeys.length > 0 ? freshKeys : keys;
    
    // Use a random selection strategy to better distribute the load
    const randomIndex = Math.floor(Math.random() * keyPool.length);
    const selectedKey = keyPool[randomIndex];
    
    console.log(`Selected fresh API key: ${randomIndex + 1} of ${keyPool.length} available keys`);
    return selectedKey;
  } catch (error) {
    console.error('Error getting fresh API key:', error);
    return DEFAULT_DEPLOYMENT_KEYS[0];
  }
}

export function setGrokApiKeys(keys: string[]): void {
  saveKeysToStorage(keys);
  clearUsage();
  currentKeyIndex = 0; // Reset the index when setting new keys
}

export function setGrokApiKey(key: string): void {
  setLegacySingleKey(key);
  saveKeysToStorage([key]);
}

export function hasGrokApiKey(): boolean {
  try {
    const keys = loadKeysFromStorage();
    const isValid = keys.some(key => typeof key === 'string' && key.startsWith('xai-') && key.length >= 20);
    return isValid;
  } catch (error) {
    console.error('Error checking for API key:', error);
    return false;
  }
}

// Token usage and quality tracking
export { 
  trackTokenUsage,
  trackResponseQuality
};

// Enhanced key pool strategies (least-used, best-performing)
export function selectLeastUsedKey(): string {
  const keys = loadKeysFromStorage();
  return getLeastUsedKey(keys) || getGrokApiKey();
}

export function selectBestPerformingKey(): string {
  const keys = loadKeysFromStorage();
  return getBestPerformingKey(keys) || getGrokApiKey();
}

// Perplexity API key features
export {
  getPerplexityApiKey,
  setPerplexityApiKey,
  hasPerplexityApiKey
};
