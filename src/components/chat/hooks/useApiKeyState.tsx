
import { useState, useEffect } from 'react';
import { hasGrokApiKey, setGrokApiKey } from '@/services/apiKeyService';
import { useToast } from '@/hooks/use-toast';
import { connectionTester } from '@/services/api/grok/connectionTester';
import { useApiKeyValidation } from './api-key/useApiKeyValidation';
import { useApiKeyStorage } from './api-key/useApiKeyStorage';
import { useApiConnectionMonitor } from './api-key/useApiConnectionMonitor';

/**
 * Enhanced hook to manage API key state with advanced validation
 */
export const useApiKeyState = () => {
  const [apiKeyDialogOpen, setApiKeyDialogOpen] = useState(false);
  const { toast } = useToast();
  
  // Use the smaller, focused hooks
  const { 
    validationStatus: keyStatus, 
    setValidationStatus: setKeyStatus, 
    validateApiKey, 
    testApiConnection 
  } = useApiKeyValidation();
  
  const {
    isGrokApiKeySet,
    setIsGrokApiKeySet,
    grokApiKeyInput,
    setGrokApiKeyInput,
    storeApiKey,
    verifyKeyStorage
  } = useApiKeyStorage();

  // Setup connection monitoring
  useApiConnectionMonitor(setIsGrokApiKeySet, setKeyStatus, keyStatus);

  // Check API key on mount and set up default key if needed
  useEffect(() => {
    const checkApiKey = async () => {
      const hasGrokKey = hasGrokApiKey();
      setIsGrokApiKeySet(hasGrokKey);
      
      // If no key is set, try to set the default API key
      if (!hasGrokKey) {
        // Save the API key provided in the code for demo purposes
        const defaultApiKey = 'xai-VDZl0d1KOqa1a6od7PwcSJa8H6voWmnmPo1P97ElrW2JHHD7pF3kFxm7Ii5Or6SdhairQkgBlQ1zOci3';
        
        try {
          setGrokApiKey(defaultApiKey);
          
          // Verify key is actually stored
          setTimeout(async () => {
            const keyStored = hasGrokApiKey();
            if (keyStored) {
              setIsGrokApiKeySet(true);
              console.log('Default Grok API key set successfully');
              
              // Test the connection with the default key
              const connectionStatus = await testApiConnection();
              
              if (connectionStatus.success) {
                toast({
                  title: "API Connected",
                  description: "Default API key is working properly.",
                });
              }
            } else {
              console.warn('API key verification failed - localStorage may be blocked');
            }
          }, 500);
        } catch (error) {
          console.error('Failed to set default API key:', error);
          toast({
            title: "API Key Error",
            description: "Failed to set default API key. Please try entering one manually.",
            variant: "destructive"
          });
        }
      } else {
        // If key exists, test the connection
        await testApiConnection();
      }
    };
    
    // Call immediately
    checkApiKey();
  }, [toast, testApiConnection, setIsGrokApiKeySet]);

  const handleSaveApiKeys = async () => {
    if (grokApiKeyInput.trim()) {
      try {
        // First validate the new API key before saving
        const keyValidation = await validateApiKey(grokApiKeyInput.trim());
        
        if (keyValidation.isValid) {
          const keyStored = await storeApiKey(grokApiKeyInput.trim());
          
          if (keyStored) {
            toast({
              title: "API Key Saved",
              description: "Your Grok API key has been saved and validated.",
            });
            setApiKeyDialogOpen(false);
          }
        } else {
          toast({
            title: "Invalid API Key",
            description: keyValidation.message,
            variant: "destructive"
          });
        }
      } catch (error) {
        console.error('Failed to save API key:', error);
        toast({
          title: "API Key Error",
          description: "Failed to save your API key. Please try again.",
          variant: "destructive"
        });
      }
    } else {
      toast({
        title: "API Key Required",
        description: "Please enter a valid Grok API key to access professional financial expertise.",
        variant: "destructive"
      });
    }
  };

  return {
    grokApiKeyInput,
    setGrokApiKeyInput,
    isGrokApiKeySet,
    setIsGrokApiKeySet,
    apiKeyDialogOpen,
    setApiKeyDialogOpen,
    handleSaveApiKeys,
    keyStatus
  };
};
