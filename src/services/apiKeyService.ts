
/**
 * Service for managing multiple API keys in local storage with robust error handling.
 */

const PRIMARY_KEYS_KEY = 'GROK_API_KEYS';
const BACKUP_KEYS_KEY = 'grokApiKeys';

// Default deployment keys pool
const DEFAULT_DEPLOYMENT_KEYS = [
  'xai-VDZl0d1KOqa1a6od7PwcSJa8H6voWmnmPo1P97ElrW2JHHD7pF3kFxm7Ii5Or6SdhairQkgBlQ1zOci3',
  'xai-wqG2hD4YSmX3mQtjr43pCeg8CCnvU9O2AEE73CTSEchgELJRDDgIdmcvZCCqB8N5T0Y00YhSCmtKBXMO',
  'xai-backup1KeyHere',
  'xai-backup2KeyHere'
];

interface ApiKeyUsage {
  key: string;
  tokensUsed: number;
  lastUsed: number;
  truncationCount: number;
  successCount: number;
}

let currentKeyIndex = 0;
const keyUsageMap = new Map<string, ApiKeyUsage>();
let lastTruncatedKey = '';

/**
 * Helper: Validate and deduplicate API keys.
 */
function filterValidKeys(keys: unknown): string[] {
  if (!Array.isArray(keys)) return [];
  const seen = new Set<string>();
  return keys.filter(k => typeof k === 'string' && k.startsWith('xai-') && k.length >= 20 && !seen.has(k) && !!seen.add(k));
}

/**
 * Helper: Load keys array from storage with fallback.
 */
function loadKeysFromStorage(): string[] {
  let keys: string[] = [];
  try {
    const raw = localStorage.getItem(PRIMARY_KEYS_KEY) || localStorage.getItem(BACKUP_KEYS_KEY);
    if (raw) {
      keys = filterValidKeys(JSON.parse(raw));
    }
  } catch (e) {
    console.warn('Could not parse API keys from storage:', e);
  }
  // If not available or invalid, use defaults
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

/**
 * Helper: Save valid API keys to both storage locations.
 */
function saveKeysToStorage(keys: string[]) {
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

/**
 * Get the next available Grok API key from the pool (with round-robin rotation)
 */
export const getGrokApiKey = (): string => {
  try {
    const keys = loadKeysFromStorage();
    if (!keys.length) throw new Error('No available API keys in storage or defaults.');
    // Robust index handling
    currentKeyIndex = (currentKeyIndex + 1) % keys.length;
    const selectedKey = keys[currentKeyIndex];
    // Update usage map
    keyUsageMap.set(
      selectedKey,
      keyUsageMap.get(selectedKey) || { 
        key: selectedKey, 
        tokensUsed: 0, 
        lastUsed: Date.now(),
        truncationCount: 0,
        successCount: 0 
      }
    );
    return selectedKey;
  } catch (error) {
    console.error('Error accessing API keys:', error);
    return DEFAULT_DEPLOYMENT_KEYS[0];
  }
};

/**
 * Get a fresh key that hasn't been associated with truncation recently
 */
export const getFreshGrokApiKey = (): string => {
  try {
    const keys = loadKeysFromStorage();
    if (!keys.length) throw new Error('No available API keys in storage or defaults.');
    
    // Filter out the last key that had truncation issues
    const freshKeys = keys.filter(key => key !== lastTruncatedKey);
    
    // If we have fresh keys, use those; otherwise use all keys
    const keyPool = freshKeys.length > 0 ? freshKeys : keys;
    
    // Pick a random key for unpredictability rather than sequential
    const randomIndex = Math.floor(Math.random() * keyPool.length);
    const selectedKey = keyPool[randomIndex];
    
    // Update usage tracking
    keyUsageMap.set(
      selectedKey,
      keyUsageMap.get(selectedKey) || { 
        key: selectedKey, 
        tokensUsed: 0, 
        lastUsed: Date.now(),
        truncationCount: 0,
        successCount: 0 
      }
    );
    
    return selectedKey;
  } catch (error) {
    console.error('Error getting fresh API key:', error);
    return DEFAULT_DEPLOYMENT_KEYS[0];
  }
};

/**
 * Set multiple Grok API keys in local storage, robustly replacing all.
 */
export const setGrokApiKeys = (keys: string[]): void => {
  saveKeysToStorage(keys);
  keyUsageMap.clear(); // Reset usage stats on set
};

/**
 * Track token usage for a specific key
 */
export const trackTokenUsage = (key: string, tokens: number): void => {
  if (!key || typeof tokens !== 'number') return;
  const usage = keyUsageMap.get(key) || {
    key,
    tokensUsed: 0,
    lastUsed: Date.now(),
    truncationCount: 0,
    successCount: 0
  };
  usage.tokensUsed += tokens;
  usage.lastUsed = Date.now();
  keyUsageMap.set(key, usage);
};

/**
 * Track response quality for a specific key
 */
export const trackResponseQuality = (key: string, wasTruncated: boolean): void => {
  if (!key) return;
  const usage = keyUsageMap.get(key) || {
    key,
    tokensUsed: 0,
    lastUsed: Date.now(),
    truncationCount: 0,
    successCount: 0
  };
  
  if (wasTruncated) {
    usage.truncationCount++;
    lastTruncatedKey = key; // Remember this key had truncation issues
  } else {
    usage.successCount++;
  }
  
  usage.lastUsed = Date.now();
  keyUsageMap.set(key, usage);
};

/**
 * Get the least used API key
 */
export const getLeastUsedKey = (): string => {
  // If there's been no usage, rotate as normal
  if (!keyUsageMap.size) return getGrokApiKey();
  let least = null;
  for (const usage of keyUsageMap.values()) {
    if (!least || usage.tokensUsed < least.tokensUsed) {
      least = usage;
    }
  }
  return least?.key || getGrokApiKey();
};

/**
 * Get the key with best performance (lowest truncation ratio)
 */
export const getBestPerformingKey = (): string => {
  // If there's been no usage, rotate as normal
  if (!keyUsageMap.size) return getGrokApiKey();
  
  let bestKey = null;
  let bestScore = -1;
  
  for (const usage of keyUsageMap.values()) {
    const totalResponses = usage.successCount + usage.truncationCount;
    if (totalResponses === 0) continue;
    
    // Calculate success rate (higher is better)
    const successRate = usage.successCount / totalResponses;
    
    // Calculate token efficiency (lower tokens used is better)
    const tokenFactor = usage.tokensUsed > 0 ? 
                      1 - Math.min(1, Math.log10(usage.tokensUsed) / 6) : 1;
    
    // Combined score (higher is better)
    const score = (successRate * 0.7) + (tokenFactor * 0.3);
    
    if (bestScore < 0 || score > bestScore) {
      bestScore = score;
      bestKey = usage.key;
    }
  }
  
  return bestKey || getGrokApiKey();
};

/**
 * Get the Perplexity API key from local storage
 */
export const getPerplexityApiKey = (): string => {
  return localStorage.getItem('PERPLEXITY_API_KEY') || '';
};

/**
 * Set the Perplexity API key in local storage
 */
export const setPerplexityApiKey = (key: string): void => {
  try {
    localStorage.setItem('PERPLEXITY_API_KEY', key);
  } catch (e) {
    console.warn('Failed to store Perplexity API key:', e);
  }
};

/**
 * Check if a Perplexity API key is set
 */
export const hasPerplexityApiKey = (): boolean => {
  return !!getPerplexityApiKey();
};

/**
 * Set a single Grok API key (as legacy single-key usage).
 */
export const setGrokApiKey = (key: string): void => {
  if (typeof key !== 'string' || !key.startsWith('xai-') || key.length < 20) {
    console.error('Invalid API key format, not saving');
    return;
  }
  try {
    localStorage.setItem('GROK_API_KEY', key);
    localStorage.setItem('grokApiKey', key);
    // Also update the multi-key pool
    saveKeysToStorage([key]);
    // Check validity
    const stored = localStorage.getItem('GROK_API_KEY');
    if (stored !== key) {
      console.warn('API key storage verification failed - primary key');
    }
  } catch (error) {
    console.error('Failed to set API key in localStorage:', error);
  }
};

/**
 * Check if at least one valid Grok API key is set
 */
export const hasGrokApiKey = (): boolean => {
  try {
    const keys = loadKeysFromStorage();
    const isValid = keys.some(key => typeof key === 'string' && key.startsWith('xai-') && key.length >= 20);
    console.log('API key validation check:', {
      found: keys.length,
      isValid
    });
    return isValid;
  } catch (error) {
    console.error('Error checking for API key:', error);
    return false;
  }
};
