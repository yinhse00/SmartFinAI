
import { useState, useEffect } from 'react';
import { hasGrokApiKey, setGrokApiKey } from '@/services/apiKeyService';
import { useToast } from '@/hooks/use-toast';
import { connectionTester } from '@/services/api/grok/connectionTester';

/**
 * Enhanced hook to manage API key state with advanced validation
 */
export const useApiKeyState = () => {
  const [grokApiKeyInput, setGrokApiKeyInput] = useState('');
  const [isGrokApiKeySet, setIsGrokApiKeySet] = useState(false);
  const [apiKeyDialogOpen, setApiKeyDialogOpen] = useState(false);
  const [keyStatus, setKeyStatus] = useState<{
    isValidating: boolean;
    isValid: boolean | null;
    message: string;
    lastChecked: number;
  }>({
    isValidating: false,
    isValid: null,
    message: '',
    lastChecked: 0
  });
  
  const { toast } = useToast();

  // Manual connection testing hook with API usage control
  const manualTestConnection = async () => {
    setKeyStatus(prev => ({ ...prev, isValidating: true }));
    
    try {
      const hasGrokKey = hasGrokApiKey();
      if (!hasGrokKey) {
        // Try to set default API key first
        const defaultApiKey = 'xai-VDZl0d1KOqa1a6od7PwcSJa8H6voWmnmPo1P97ElrW2JHHD7pF3kFxm7Ii5Or6SdhairQkgBlQ1zOci3';
        setGrokApiKey(defaultApiKey);
        
        // Verify key was stored
        setTimeout(() => {
          const keyStored = hasGrokApiKey();
          setIsGrokApiKeySet(keyStored);
          
          if (!keyStored) {
            setKeyStatus({
              isValidating: false,
              isValid: false,
              message: 'Unable to store API key in browser storage. Private browsing mode may block storage.',
              lastChecked: Date.now()
            });
            toast({
              title: "API Key Storage Issue",
              description: "Unable to store API key in browser storage. Private browsing mode may block storage.",
              variant: "destructive"
            });
            return;
          }
        }, 500);
      }
      
      // Test the connection
      const connectionStatus = await connectionTester.testApiConnection();
      
      setKeyStatus({
        isValidating: false,
        isValid: connectionStatus.success,
        message: connectionStatus.message,
        lastChecked: Date.now()
      });
      
      toast({
        title: connectionStatus.success ? "API Connected" : "API Connection Issue",
        description: connectionStatus.message,
        variant: connectionStatus.success ? "default" : "destructive"
      });
      
    } catch (error) {
      console.error('Manual connection test failed:', error);
      setKeyStatus({
        isValidating: false,
        isValid: false,
        message: 'Connection test failed',
        lastChecked: Date.now()
      });
      toast({
        title: "Connection Test Failed",
        description: "Unable to test API connection",
        variant: "destructive"
      });
    }
  };

  // Check API key on mount (one-time only, no automatic intervals)
  useEffect(() => {
    const checkApiKey = () => {
      const hasGrokKey = hasGrokApiKey();
      setIsGrokApiKeySet(hasGrokKey);
      
      if (!hasGrokKey) {
        setKeyStatus({
          isValidating: false,
          isValid: null,
          message: 'No API key configured',
          lastChecked: Date.now()
        });
      } else {
        setKeyStatus({
          isValidating: false,
          isValid: null,
          message: 'API key found - Click "Test Connection" to verify',
          lastChecked: Date.now()
        });
      }
    };
    
    // Call once on mount
    checkApiKey();
  }, []);

  const handleSaveApiKeys = async () => {
    if (grokApiKeyInput.trim()) {
      try {
        // First validate the new API key before saving
        setKeyStatus(prev => ({ ...prev, isValidating: true }));
        const keyValidation = await connectionTester.testApiKeyValidity(grokApiKeyInput.trim());
        
        if (keyValidation.isValid) {
          setGrokApiKey(grokApiKeyInput.trim());
          
          // Verify key was actually stored
          setTimeout(async () => {
            const keyStored = hasGrokApiKey();
            if (keyStored) {
              setIsGrokApiKeySet(true);
              setKeyStatus({
                isValidating: false,
                isValid: true,
                message: keyValidation.message,
                lastChecked: Date.now()
              });
              toast({
                title: "API Key Saved",
                description: `Your Grok API key has been saved and validated. ${keyValidation.quotaRemaining !== undefined ? `Quota remaining: ${keyValidation.quotaRemaining}` : ''}`,
              });
              setApiKeyDialogOpen(false);
            } else {
              console.warn('API key verification failed - localStorage may be blocked');
              setKeyStatus({
                isValidating: false,
                isValid: false,
                message: 'Unable to store API key. Private browsing mode may block storage.',
                lastChecked: Date.now()
              });
              toast({
                title: "API Key Storage Issue",
                description: "Unable to store API key. Private browsing mode may block storage.",
                variant: "destructive"
              });
            }
          }, 500);
        } else {
          setKeyStatus({
            isValidating: false,
            isValid: false,
            message: keyValidation.message,
            lastChecked: Date.now()
          });
          toast({
            title: "Invalid API Key",
            description: keyValidation.message,
            variant: "destructive"
          });
        }
      } catch (error) {
        console.error('Failed to save API key:', error);
        setKeyStatus({
          isValidating: false,
          isValid: false,
          message: error instanceof Error ? error.message : 'Unknown error occurred',
          lastChecked: Date.now()
        });
        toast({
          title: "API Key Error",
          description: "Failed to save your API key. Please try again.",
          variant: "destructive"
        });
        return;
      }
    } else {
      toast({
        title: "API Key Required",
        description: "Please enter a valid Grok API key to access professional financial expertise.",
        variant: "destructive"
      });
      return;
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
    keyStatus,
    manualTestConnection
  };
};
