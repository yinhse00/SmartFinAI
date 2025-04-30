
// Facade for Grok/Perplexity API key, storage, selection logic (backwards compatibility).
// All actual logic is in submodules: apiKey/keyStorage.ts, apiKey/keyUsageTracker.ts, apiKey/grokKeyManager.ts

// Re-export all required functions from grokKeyManager with enhanced rotation
export {
  getGrokApiKey,
  getFreshGrokApiKey,
  setGrokApiKeys,
  setGrokApiKey,
  hasGrokApiKey,
  selectLeastUsedKey,
  selectBestPerformingKey,
  rotateApiKey
} from './apiKey/grokKeyManager';

// Re-export tracking functions from keyUsageTracker with improved usage distribution
export {
  trackTokenUsage,
  trackResponseQuality,
  resetUsageCounters
} from './apiKey/keyUsageTracker';

// Re-export Perplexity-related functions
export {
  getPerplexityApiKey,
  setPerplexityApiKey,
  hasPerplexityApiKey
} from './apiKey/keyStorage';
