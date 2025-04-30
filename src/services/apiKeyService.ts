
import { getGrokApiKey, setGrokApiKey, rotateApiKey } from './apiKey/grokKeyManager';
import { hasGrokApiKey } from './apiKey/keyStorage';
import { resetUsageCounters, trackTokenUsage, trackResponseQuality } from './apiKey/keyUsageTracker';

// Export a getFreshGrokApiKey function for the retry handler
export const getFreshGrokApiKey = () => {
  // For now, we'll just rotate and return a new key
  return rotateApiKey();
};

// Export selectLeastUsedKey for the requestProcessor
export const selectLeastUsedKey = () => {
  // For simplicity, we'll just return the regular API key
  return getGrokApiKey();
};

// Export selectBestPerformingKey for the requestProcessor
export const selectBestPerformingKey = () => {
  // For simplicity, we'll just return the regular API key
  return getGrokApiKey();
};

export {
  getGrokApiKey,
  setGrokApiKey,
  hasGrokApiKey,
  rotateApiKey,
  trackTokenUsage,
  trackResponseQuality,
  resetUsageCounters
};
