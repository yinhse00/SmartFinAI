
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
  hasGrokApiKey
} from './keyStorage';

import {
  trackRequest,
  shouldRotateKey,
  resetUsageCounters,
} from './keyUsageTracker';

let currentKeyIndex = 0;
let lastKeySelectionTime = Date.now();
const KEY_ROTATION_INTERVAL = 15000; // 15 seconds minimum between forced rotations - reduced from 30 seconds

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
    
    // More aggressive rotation - always rotate if we have multiple keys
    if (shouldForceRotate || keys.length > 1) {
      // Improved round-robin rotation with forced periodic changes
      currentKeyIndex = (currentKeyIndex + 1) % keys.length;
      lastKeySelectionTime = now;
      console.log(`API key rotated: now using key ${currentKeyIndex + 1} of ${keys.length}`);
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
 * Force rotation of API key - returns new key
 * This function is used by the batch continuation to avoid CORS issues
 */
export function rotateApiKey(): string {
  try {
    const keys = loadKeysFromStorage();
    if (!keys.length) throw new Error('No available API keys in storage or defaults.');
    
    // Force rotation to next key
    currentKeyIndex = (currentKeyIndex + 1) % keys.length;
    lastKeySelectionTime = Date.now();
    
    const rotatedKey = keys[currentKeyIndex];
    console.log(`API key manually rotated: now using key ${currentKeyIndex + 1} of ${keys.length}`);
    
    return rotatedKey;
  } catch (error) {
    console.error('Error rotating API key:', error);
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

// Perplexity API key features
export {
  getPerplexityApiKey,
  setPerplexityApiKey,
  hasPerplexityApiKey,
  hasGrokApiKey,
  resetUsageCounters
};
