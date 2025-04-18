
/**
 * Service for managing API keys in local storage
 */

// Use multiple storage methods to increase reliability
const PRIMARY_KEY = 'GROK_API_KEY';
const BACKUP_KEY = 'grokApiKey';

// Default deployment key for environments without localStorage access
const DEFAULT_DEPLOYMENT_KEY = 'xai-VDZl0d1KOqa1a6od7PwcSJa8H6voWmnmPo1P97ElrW2JHHD7pF3kFxm7Ii5Or6SdhairQkgBlQ1zOci3';

/**
 * Get the Grok API key from local storage
 * Enhanced to work reliably across all environments
 */
export const getGrokApiKey = (): string => {
  try {
    // Try primary key first
    const primaryValue = localStorage.getItem(PRIMARY_KEY);
    if (primaryValue) {
      // Validate format before returning
      if (primaryValue.startsWith('xai-') && primaryValue.length >= 20) {
        return primaryValue;
      } else {
        console.warn('Invalid API key format found in primary storage');
      }
    }
    
    // Try backup key
    const backupValue = localStorage.getItem(BACKUP_KEY);
    if (backupValue) {
      // Validate format before returning
      if (backupValue.startsWith('xai-') && backupValue.length >= 20) {
        // Sync to primary key for future use
        try {
          localStorage.setItem(PRIMARY_KEY, backupValue);
        } catch (e) {
          console.warn('Failed to sync backup key to primary key', e);
        }
        return backupValue;
      } else {
        console.warn('Invalid API key format found in backup storage');
      }
    }
    
    // Log what's actually in storage for debugging
    console.log('Storage state:', {
      primaryKey: primaryValue ? `${primaryValue.substring(0, 4)}...` : 'none',
      backupKey: backupValue ? `${backupValue.substring(0, 4)}...` : 'none'
    });
    
    // Always return default deployment key if localStorage access fails
    // This ensures all environments have a working key
    console.log('No valid API key found in storage, using default deployment key');
    
    try {
      // Attempt to store the default key for future use
      localStorage.setItem(PRIMARY_KEY, DEFAULT_DEPLOYMENT_KEY);
      localStorage.setItem(BACKUP_KEY, DEFAULT_DEPLOYMENT_KEY);
      console.log('Set default deployment API key');
    } catch (e) {
      console.error('Failed to set default deployment key in localStorage', e);
      // Even if localStorage fails, we still return the default key
    }
    
    return DEFAULT_DEPLOYMENT_KEY;
  } catch (error) {
    console.error('Error accessing localStorage for API key:', error);
    // Return default key even if there's an error accessing localStorage
    return DEFAULT_DEPLOYMENT_KEY;
  }
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
      localStorage.setItem(PRIMARY_KEY, key);
      console.log('Successfully set primary API key');
    } catch (e) {
      console.warn('Failed to set primary API key', e);
    }
    
    try {
      localStorage.setItem(BACKUP_KEY, key);
      console.log('Successfully set backup API key');
    } catch (e) {
      console.warn('Failed to set backup API key', e);
    }
    
    // Verify storage was successful
    try {
      const storedKey = localStorage.getItem(PRIMARY_KEY);
      const backupStoredKey = localStorage.getItem(BACKUP_KEY);
      
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
