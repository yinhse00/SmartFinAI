import { useState, useEffect } from 'react';
import { hasGrokApiKey } from '@/services/apiKeyService';

export const useGlobalApiKeyState = () => {
  const [hasApiKey, setHasApiKey] = useState(false);

  const checkApiKey = () => {
    setHasApiKey(hasGrokApiKey());
  };

  useEffect(() => {
    // Initial check
    checkApiKey();

    // Listen for storage changes (when API keys are saved in other components)
    const handleStorageChange = () => {
      checkApiKey();
    };

    window.addEventListener('storage', handleStorageChange);
    
    // Also listen for custom events from within the same tab
    window.addEventListener('apiKeyUpdated', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('apiKeyUpdated', handleStorageChange);
    };
  }, []);

  return { hasApiKey, checkApiKey };
};