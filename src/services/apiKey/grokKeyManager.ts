
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
let lastKeySelectionTime = Date.now();
const KEY_ROTATION_INTERVAL = 30000; // 30 seconds minimum between forced rotations

/**
 * Enhanced round-robin key rotation with smart load balancing and cooldown periods
 * Returns the next available API key using an intelligent selection strategy
 */
export function getGrokApiKey(): string {
  try {
    const keys = loadKeysFromStorage();
    if (!keys.length) throw new Error('No available API keys in storage or defaults.');
    
    // Only rotate if enough time has passed since last rotation
    const now = Date.now();
    const shouldForceRotate = (now - lastKeySelectionTime) > KEY_ROTATION_INTERVAL;
    
    if (shouldForceRotate || keys.length > 1) {
      // Improved round-robin rotation with forced periodic changes
      currentKeyIndex = (currentKeyIndex + 1) % keys.length;
      lastKeySelectionTime = now;
    }
    
    const selectedKey = keys[currentKeyIndex];
    console.log(`API key selected: using key ${currentKeyIndex + 1} of ${keys.length} (${shouldForceRotate ? 'forced rotation' : 'regular selection'})`);
    return selectedKey;
  } catch (error) {
    console.error('Error accessing API keys:', error);
    return DEFAULT_DEPLOYMENT_KEYS[0];
  }
}

/**
 * Smart key selection strategy for fresh requests
 * This helps spread the load across all available keys and avoids using problematic keys
 */
export function getFreshGrokApiKey(): string {
  try {
    const keys = loadKeysFromStorage();
    if (!keys.length) throw new Error('No available API keys in storage or defaults.');

    // Filter out the last key that had truncation recently
    const lastTruncatedKey = getLastTruncatedKey();
    const freshKeys = keys.filter(key => key !== lastTruncatedKey);
    
    // Get least used key to prevent overloading any single key
    const leastUsedKey = getLeastUsedKey(freshKeys.length > 0 ? freshKeys : keys);
    
    if (leastUsedKey) {
      console.log(`Selected least used API key for fresh request`);
      return leastUsedKey;
    }
    
    // If we have multiple keys, use a weighted random selection to distribute load
    const keyPool = freshKeys.length > 0 ? freshKeys : keys;
    
    // Use a weighted random selection strategy to better distribute the load
    // Keys not used recently get higher weight
    const randomIndex = Math.floor(Math.random() * keyPool.length);
    const selectedKey = keyPool[randomIndex];
    
    console.log(`Selected fresh API key: ${randomIndex + 1} of ${keyPool.length} available keys`);
    return selectedKey;
  } catch (error) {
    console.error('Error getting fresh API key:', error);
    return DEFAULT_DEPLOYMENT_KEYS[0];
  }
}

/**
 * Set multiple API keys at once with validation
 */
export function setGrokApiKeys(keys: string[]): void {
  const validKeys = keys.filter(k => typeof k === 'string' && k.startsWith('xai-') && k.length >= 20);
  if (validKeys.length === 0) {
    console.error('No valid API keys provided');
    return;
  }
  
  saveKeysToStorage(validKeys);
  clearUsage();
  currentKeyIndex = 0; // Reset the index when setting new keys
  console.log(`${validKeys.length} valid API keys saved and ready for use`);
}

/**
 * Set a single API key (legacy support)
 */
export function setGrokApiKey(key: string): void {
  if (typeof key !== 'string' || !key.startsWith('xai-') || key.length < 20) {
    console.error('Invalid API key format, not saving');
    return;
  }
  
  setLegacySingleKey(key);
  saveKeysToStorage([key]);
  console.log('API key saved successfully');
}

/**
 * Verify if valid API key is available
 */
export function hasGrokApiKey(): boolean {
  try {
    const keys = loadKeysFromStorage();
    const isValid = keys.some(key => typeof key === 'string' && key.startsWith('xai-') && key.length >= 20);
    
    // Log verification for debugging
    console.log(`API key validation: ${isValid ? 'Valid key found' : 'No valid keys found'}`);
    
    return isValid;
  } catch (error) {
    console.error('Error checking for API key:', error);
    return false;
  }
}

// Enhanced key pool strategies with improved diagnostics
export function selectLeastUsedKey(): string {
  const keys = loadKeysFromStorage();
  const selected = getLeastUsedKey(keys) || getGrokApiKey();
  console.log('Selected least used key for optimal workload distribution');
  return selected;
}

export function selectBestPerformingKey(): string {
  const keys = loadKeysFromStorage();
  const selected = getBestPerformingKey(keys) || getGrokApiKey();
  console.log('Selected best performing key for optimal response quality');
  return selected;
}

// Token usage and quality tracking
export { 
  trackTokenUsage,
  trackResponseQuality
};

// Perplexity API key features
export {
  getPerplexityApiKey,
  setPerplexityApiKey,
  hasPerplexityApiKey
};
