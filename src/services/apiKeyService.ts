
// Facade for Grok/Perplexity API key, storage, selection logic (backwards compatibility).
// All actual logic is in submodules: apiKey/keyStorage.ts, apiKey/keyUsageTracker.ts, apiKey/grokKeyManager.ts

// Re-export all required functions from grokKeyManager
export {
  getGrokApiKey,
  getFreshGrokApiKey,
  setGrokApiKeys,
  setGrokApiKey,
  hasGrokApiKey,
  selectLeastUsedKey,
  selectBestPerformingKey,
  getBatchContinuationKey
} from './apiKey/grokKeyManager';

// Re-export tracking functions from keyUsageTracker
export {
  trackTokenUsage,
  trackResponseQuality
} from './apiKey/keyUsageTracker';

// Re-export Perplexity-related functions (synchronous versions for backward compatibility)
export {
  getPerplexityApiKeySync as getPerplexityApiKey,
  setPerplexityApiKeySync as setPerplexityApiKey,
  hasPerplexityApiKeySync as hasPerplexityApiKey,
  getGoogleApiKeySync as getGoogleApiKey,
  setGoogleApiKeySync as setGoogleApiKey,
  hasGoogleApiKeySync as hasGoogleApiKey
} from './apiKey/keyStorageSync';
