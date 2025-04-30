
import { getGrokApiKey, setGrokApiKey } from './apiKey/grokKeyManager';
import { hasGrokApiKey } from './apiKey/keyStorage';
import { resetUsageCounters } from './apiKey/keyUsageTracker';

const rotateApiKey = () => {
  try {
    const currentKey = getGrokApiKey();
    
    // Reset usage counters for the current key
    resetUsageCounters();
    
    // For simplicity, we're just returning the same key
    // In a production environment, you might implement key rotation from a pool
    return currentKey;
  } catch (error) {
    console.error('Error rotating API key:', error);
    return getGrokApiKey();
  }
};

export {
  getGrokApiKey,
  setGrokApiKey,
  hasGrokApiKey,
  rotateApiKey
};
