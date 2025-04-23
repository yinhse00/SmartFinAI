
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

export function getGrokApiKey(): string {
  try {
    const keys = loadKeysFromStorage();
    if (!keys.length) throw new Error('No available API keys in storage or defaults.');
    currentKeyIndex = (currentKeyIndex + 1) % keys.length;
    const selectedKey = keys[currentKeyIndex];
    return selectedKey;
  } catch (error) {
    console.error('Error accessing API keys:', error);
    return DEFAULT_DEPLOYMENT_KEYS[0];
  }
}

export function getFreshGrokApiKey(): string {
  try {
    const keys = loadKeysFromStorage();
    if (!keys.length) throw new Error('No available API keys in storage or defaults.');

    // Filter out the last key that had truncation recently
    const freshKeys = keys.filter(key => key !== getLastTruncatedKey());
    const keyPool = freshKeys.length > 0 ? freshKeys : keys;
    const randomIndex = Math.floor(Math.random() * keyPool.length);
    return keyPool[randomIndex];
  } catch (error) {
    console.error('Error getting fresh API key:', error);
    return DEFAULT_DEPLOYMENT_KEYS[0];
  }
}

export function setGrokApiKeys(keys: string[]): void {
  saveKeysToStorage(keys);
  clearUsage();
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

// Key pool strategies (least-used, best-performing)
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

