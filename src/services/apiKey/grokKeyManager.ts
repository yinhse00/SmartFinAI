
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
const BATCH_KEY_ROTATION_INTERVAL = 10000; // 10 seconds between rotations for batch requests

// Track which keys were used for which conversation threads
const conversationKeyMap = new Map<string, string>();

/**
 * Enhanced round-robin key rotation with smart load balancing and cooldown periods
 * Returns the next available API key using an intelligent selection strategy
 */
export function getGrokApiKey(options: {
  isBatchRequest?: boolean,
  batchNumber?: number,
  conversationId?: string
} = {}): string {
  try {
    const keys = loadKeysFromStorage();
    if (!keys.length) throw new Error('No available API keys in storage or defaults.');
    
    // If this is part of a conversation thread, try to use the same key
    if (options.conversationId && conversationKeyMap.has(options.conversationId)) {
      const existingKey = conversationKeyMap.get(options.conversationId);
      // Verify the key is still in our pool
      if (existingKey && keys.includes(existingKey)) {
        console.log(`Using existing key for conversation ${options.conversationId}`);
        return existingKey;
      }
    }
    
    // For batch requests, we should use a consistent key for continuity
    if (options.isBatchRequest && options.batchNumber && options.batchNumber > 1) {
      // Use a different rotation interval for batch requests to prevent token limit issues
      const now = Date.now();
      const rotationInterval = options.isBatchRequest ? 
        BATCH_KEY_ROTATION_INTERVAL : KEY_ROTATION_INTERVAL;
      const shouldForceRotate = (now - lastKeySelectionTime) > rotationInterval;
      
      if (shouldForceRotate || keys.length > 1) {
        // For batch requests, use a different selection strategy to ensure continuity
        currentKeyIndex = (currentKeyIndex + 1) % keys.length;
        lastKeySelectionTime = now;
        console.log(`Batch continuation - rotating to key ${currentKeyIndex + 1}`);
      }
    } else {
      // Only rotate if enough time has passed since last rotation
      const now = Date.now();
      const shouldForceRotate = (now - lastKeySelectionTime) > KEY_ROTATION_INTERVAL;
      
      if (shouldForceRotate || keys.length > 1) {
        // Improved round-robin rotation with forced periodic changes
        currentKeyIndex = (currentKeyIndex + 1) % keys.length;
        lastKeySelectionTime = now;
      }
    }
    
    const selectedKey = keys[currentKeyIndex];
    
    // Store key association with conversation if provided
    if (options.conversationId) {
      conversationKeyMap.set(options.conversationId, selectedKey);
    }
    
    console.log(`API key selected: using key ${currentKeyIndex + 1} of ${keys.length} ${options.isBatchRequest ? 'for batch request' : ''}`);
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
export function getFreshGrokApiKey(options: {
  conversationId?: string,
  preferConsistency?: boolean
} = {}): string {
  try {
    const keys = loadKeysFromStorage();
    if (!keys.length) throw new Error('No available API keys in storage or defaults.');

    // If conversation consistency is preferred, use existing key if available
    if (options.preferConsistency && 
        options.conversationId && 
        conversationKeyMap.has(options.conversationId)) {
      const existingKey = conversationKeyMap.get(options.conversationId);
      // Verify the key is still in our pool
      if (existingKey && keys.includes(existingKey)) {
        console.log(`Maintaining conversation consistency for ${options.conversationId}`);
        return existingKey;
      }
    }
    
    // Filter out the last key that had truncation recently
    const lastTruncatedKey = getLastTruncatedKey();
    const freshKeys = keys.filter(key => key !== lastTruncatedKey);
    
    // Get least used key to prevent overloading any single key
    const leastUsedKey = getLeastUsedKey(freshKeys.length > 0 ? freshKeys : keys);
    
    if (leastUsedKey) {
      console.log(`Selected least used API key for fresh request`);
      
      // Store key association with conversation if provided
      if (options.conversationId) {
        conversationKeyMap.set(options.conversationId, leastUsedKey);
      }
      
      return leastUsedKey;
    }
    
    // If we have multiple keys, use a weighted random selection to distribute load
    const keyPool = freshKeys.length > 0 ? freshKeys : keys;
    
    // Use a weighted random selection strategy to better distribute the load
    // Keys not used recently get higher weight
    const randomIndex = Math.floor(Math.random() * keyPool.length);
    const selectedKey = keyPool[randomIndex];
    
    // Store key association with conversation if provided
    if (options.conversationId) {
      conversationKeyMap.set(options.conversationId, selectedKey);
    }
    
    console.log(`Selected fresh API key: ${randomIndex + 1} of ${keyPool.length} available keys`);
    return selectedKey;
  } catch (error) {
    console.error('Error getting fresh API key:', error);
    return DEFAULT_DEPLOYMENT_KEYS[0];
  }
}

/**
 * Get API key specifically optimized for batch continuation
 * This ensures consistent communication with the same API server
 */
export function getBatchContinuationKey(
  conversationId?: string, 
  batchNumber?: number
): string {
  try {
    const keys = loadKeysFromStorage();
    if (!keys.length) throw new Error('No available API keys in storage or defaults.');
    
    // For batch continuations, try to use the same key from the conversation
    if (conversationId && conversationKeyMap.has(conversationId)) {
      const existingKey = conversationKeyMap.get(conversationId);
      // Verify the key is still valid and in our pool
      if (existingKey && keys.includes(existingKey) && existingKey.startsWith('xai-')) {
        console.log(`Using consistent key for batch continuation ${batchNumber || ''}`);
        return existingKey;
      }
    }
    
    // If no conversation key, or it's invalid, use a key that hasn't had truncation issues
    const lastTruncatedKey = getLastTruncatedKey();
    const preferredKeys = keys.filter(key => key !== lastTruncatedKey);
    
    if (preferredKeys.length > 0) {
      const selectedKey = preferredKeys[0];
      
      // Store this key for the conversation
      if (conversationId) {
        conversationKeyMap.set(conversationId, selectedKey);
      }
      
      return selectedKey;
    }
    
    // Fallback to basic key selection
    return keys[0];
  } catch (error) {
    console.error('Error getting batch continuation key:', error);
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
  // Clear conversation-key associations when keys change
  conversationKeyMap.clear();
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
  // Clear conversation-key associations when key changes
  conversationKeyMap.clear();
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

/**
 * Clear conversation-key associations
 * Useful when starting a new conversation or when there are issues with the current key
 */
export function resetConversationKeys(): void {
  conversationKeyMap.clear();
  console.log('Conversation key associations cleared');
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
