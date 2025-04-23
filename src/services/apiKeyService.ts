/**
 * Service for managing multiple API keys in local storage
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
}

let currentKeyIndex = 0;
const keyUsageMap = new Map<string, ApiKeyUsage>();

/**
 * Get the next available Grok API key from the pool
 */
export const getGrokApiKey = (): string => {
  try {
    // Try to get the array of keys
    const keysString = localStorage.getItem(PRIMARY_KEYS_KEY);
    let keys: string[] = [];
    
    if (keysString) {
      try {
        keys = JSON.parse(keysString);
        // Validate format of all keys
        keys = keys.filter(key => key.startsWith('xai-') && key.length >= 20);
      } catch (e) {
        console.warn('Invalid API keys format in storage');
      }
    }
    
    // If no valid keys found in primary storage, try backup
    if (keys.length === 0) {
      const backupKeysString = localStorage.getItem(BACKUP_KEYS_KEY);
      if (backupKeysString) {
        try {
          keys = JSON.parse(backupKeysString);
          keys = keys.filter(key => key.startsWith('xai-') && key.length >= 20);
          
          // Sync to primary storage if valid keys found
          if (keys.length > 0) {
            localStorage.setItem(PRIMARY_KEYS_KEY, JSON.stringify(keys));
          }
        } catch (e) {
          console.warn('Invalid API keys format in backup storage');
        }
      }
    }
    
    // If still no valid keys, use defaults
    if (keys.length === 0) {
      keys = DEFAULT_DEPLOYMENT_KEYS;
      try {
        localStorage.setItem(PRIMARY_KEYS_KEY, JSON.stringify(keys));
        localStorage.setItem(BACKUP_KEYS_KEY, JSON.stringify(keys));
      } catch (e) {
        console.error('Failed to set default deployment keys', e);
      }
    }
    
    // Rotate through available keys
    currentKeyIndex = (currentKeyIndex + 1) % keys.length;
    const selectedKey = keys[currentKeyIndex];
    
    // Update usage tracking
    const usage = keyUsageMap.get(selectedKey) || {
      key: selectedKey,
      tokensUsed: 0,
      lastUsed: Date.now()
    };
    keyUsageMap.set(selectedKey, usage);
    
    return selectedKey;
  } catch (error) {
    console.error('Error accessing API keys:', error);
    return DEFAULT_DEPLOYMENT_KEYS[0];
  }
};

/**
 * Set multiple Grok API keys in local storage
 */
export const setGrokApiKeys = (keys: string[]): void => {
  try {
    // Validate key format before storing
    const validKeys = keys.filter(key => key.startsWith('xai-') && key.length >= 20);
    
    if (validKeys.length === 0) {
      console.error('No valid API keys provided');
      return;
    }
    
    // Store in both locations for redundancy
    try {
      localStorage.setItem(PRIMARY_KEYS_KEY, JSON.stringify(validKeys));
      console.log('Successfully set primary API keys');
    } catch (e) {
      console.warn('Failed to set primary API keys', e);
    }
    
    try {
      localStorage.setItem(BACKUP_KEYS_KEY, JSON.stringify(validKeys));
      console.log('Successfully set backup API keys');
    } catch (e) {
      console.warn('Failed to set backup API keys', e);
    }
    
    // Reset usage tracking
    keyUsageMap.clear();
  } catch (error) {
    console.error('Failed to set API keys:', error);
  }
};

/**
 * Track token usage for a specific key
 */
export const trackTokenUsage = (key: string, tokens: number): void => {
  const usage = keyUsageMap.get(key) || {
    key,
    tokensUsed: 0,
    lastUsed: Date.now()
  };
  
  usage.tokensUsed += tokens;
  usage.lastUsed = Date.now();
  keyUsageMap.set(key, usage);
};

/**
 * Get the least used API key
 */
export const getLeastUsedKey = (): string => {
  const keys = Array.from(keyUsageMap.values());
  if (keys.length === 0) return getGrokApiKey();
  
  return keys.sort((a, b) => a.tokensUsed - b.tokensUsed)[0].key;
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
  localStorage.setItem('PERPLEXITY_API_KEY', key);
};

/**
 * Check if a Perplexity API key is set
 */
export const hasPerplexityApiKey = (): boolean => {
  return !!getPerplexityApiKey();
};

/**
 * Set the Grok API key in local storage with enhanced reliability
 */
export const setGrokApiKey = (key: string): void => {
  try {
    // Validate key format before storing
    if (!key.startsWith('xai-') || key.length < 20) {
      console.error('Invalid API key format, not saving');
      return;
    }
    
    // Try to store in both locations for redundancy
    try {
      localStorage.setItem('GROK_API_KEY', key);
      console.log('Successfully set primary API key');
    } catch (e) {
      console.warn('Failed to set primary API key', e);
    }
    
    try {
      localStorage.setItem('grokApiKey', key);
      console.log('Successfully set backup API key');
    } catch (e) {
      console.warn('Failed to set backup API key', e);
    }
    
    // Verify storage was successful
    try {
      const storedKey = localStorage.getItem('GROK_API_KEY');
      const backupStoredKey = localStorage.getItem('grokApiKey');
      
      console.log('API key storage verification:', {
        primaryKeySet: !!storedKey,
        primaryKeyMatches: storedKey === key,
        backupKeySet: !!backupStoredKey,
        backupKeyMatches: backupStoredKey === key
      });
      
      if (storedKey !== key) {
        console.warn('API key storage verification failed - primary key');
      }
      
      if (backupStoredKey !== key) {
        console.warn('API key storage verification failed - backup key');
      }
    } catch (e) {
      console.warn('API key verification failed', e);
    }
  } catch (error) {
    console.error('Failed to set API key in localStorage:', error);
  }
};

/**
 * Check if a Grok API key is set with enhanced validation
 */
export const hasGrokApiKey = (): boolean => {
  try {
    const key = getGrokApiKey();
    const isValid = !!key && key.length > 10 && key.startsWith('xai-');
    
    console.log('API key validation check:', {
      hasKey: !!key,
      isValid: isValid,
      keyStart: key ? key.substring(0, 6) : 'none'
    });
    
    return isValid;
  } catch (error) {
    console.error('Error checking for API key:', error);
    // If any errors occur, assume we have a key (the default one)
    return true;
  }
};
