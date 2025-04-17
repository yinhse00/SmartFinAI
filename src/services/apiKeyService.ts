
/**
 * Service for managing API keys in local storage
 */

// CRITICAL FIX: Multiple storage methods to increase reliability across environments
const PRIMARY_KEY = 'GROK_API_KEY';
const BACKUP_KEY = 'grokApiKey';

/**
 * Get the Grok API key from local storage
 */
export const getGrokApiKey = (): string => {
  try {
    // Try primary key first
    const primaryValue = localStorage.getItem(PRIMARY_KEY);
    if (primaryValue) {
      return primaryValue;
    }
    
    // Try backup key
    const backupValue = localStorage.getItem(BACKUP_KEY);
    if (backupValue) {
      // Sync to primary key for future use
      try {
        localStorage.setItem(PRIMARY_KEY, backupValue);
      } catch (e) {
        console.warn('Failed to sync backup key to primary key', e);
      }
      return backupValue;
    }
    
    return '';
  } catch (error) {
    console.error('Error accessing localStorage for API key:', error);
    return '';
  }
};

/**
 * Set the Grok API key in local storage
 */
export const setGrokApiKey = (key: string): void => {
  try {
    // Try to store in both locations for redundancy
    localStorage.setItem(PRIMARY_KEY, key);
    localStorage.setItem(BACKUP_KEY, key);
    
    // Verify storage was successful
    const storedKey = localStorage.getItem(PRIMARY_KEY);
    if (storedKey !== key) {
      console.warn('API key storage verification failed - primary key');
    }
    
    const backupStoredKey = localStorage.getItem(BACKUP_KEY);
    if (backupStoredKey !== key) {
      console.warn('API key storage verification failed - backup key');
    }
  } catch (error) {
    console.error('Failed to set API key in localStorage:', error);
    throw error;
  }
};

/**
 * Check if a Grok API key is set
 */
export const hasGrokApiKey = (): boolean => {
  try {
    const key = getGrokApiKey();
    return !!key && key.length > 10; // Basic validation - must be non-empty and reasonable length
  } catch (error) {
    console.error('Error checking for API key:', error);
    return false;
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
