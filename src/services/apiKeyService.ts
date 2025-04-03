
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
