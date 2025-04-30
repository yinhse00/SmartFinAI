
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { hasGrokApiKey, setGrokApiKey } from '@/services/apiKeyService';

/**
 * Hook for handling API key storage operations
 */
export const useApiKeyStorage = () => {
  const [isGrokApiKeySet, setIsGrokApiKeySet] = useState(false);
  const [grokApiKeyInput, setGrokApiKeyInput] = useState('');
  const { toast } = useToast();

  // Check if API key exists on mount
  useEffect(() => {
    const checkStoredKey = () => {
      try {
        const hasKey = hasGrokApiKey();
        setIsGrokApiKeySet(hasKey);
        return hasKey;
      } catch (error) {
        console.error('Error checking for stored API key:', error);
        return false;
      }
    };

    checkStoredKey();
  }, []);

  /**
   * Store API key and verify it was saved properly
   */
  const storeApiKey = async (apiKey: string): Promise<boolean> => {
    try {
      if (!apiKey || apiKey.trim() === '') {
        toast({
          title: "API Key Required",
          description: "Please enter a valid Grok API key.",
          variant: "destructive"
        });
        return false;
      }

      setGrokApiKey(apiKey.trim());
      
      // Verify key was actually stored
      return await verifyKeyStorage();
    } catch (error) {
      console.error('Error storing API key:', error);
      
      toast({
        title: "API Key Storage Error",
        description: error instanceof Error ? error.message : 'Failed to store API key',
        variant: "destructive"
      });
      
      return false;
    }
  };

  /**
   * Verify if key was properly stored in storage
   */
  const verifyKeyStorage = async (): Promise<boolean> => {
    // Small delay to ensure storage has time to complete
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const keyStored = hasGrokApiKey();
    setIsGrokApiKeySet(keyStored);
    
    if (!keyStored) {
      console.warn('API key verification failed - localStorage may be blocked');
      toast({
        title: "API Key Storage Issue",
        description: "Unable to store API key in browser storage. Private browsing mode may block storage.",
        variant: "destructive"
      });
    }
    
    return keyStored;
  };

  return {
    isGrokApiKeySet,
    setIsGrokApiKeySet,
    grokApiKeyInput,
    setGrokApiKeyInput,
    storeApiKey,
    verifyKeyStorage
  };
};
