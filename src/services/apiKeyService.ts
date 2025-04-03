
/**
 * Service for managing API keys in local storage
 */

// Note: In a real application, API keys should be stored securely on the backend
// and not exposed in the frontend code

/**
 * Get the Grok API key from local storage
 */
export const getGrokApiKey = (): string => {
  return localStorage.getItem('GROK_API_KEY') || '';
};

/**
 * Set the Grok API key in local storage
 */
export const setGrokApiKey = (key: string): void => {
  localStorage.setItem('GROK_API_KEY', key);
};

/**
 * Check if a Grok API key is set
 */
export const hasGrokApiKey = (): boolean => {
  return !!getGrokApiKey();
};
