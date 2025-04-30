
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

  // Check API key on mount and periodically
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
              setKeyStatus(prev => ({ ...prev, isValidating: true }));
              const connectionStatus = await connectionTester.testApiConnection(defaultApiKey);
              
              setKeyStatus({
                isValidating: false,
                isValid: connectionStatus.success,
                message: connectionStatus.message,
                lastChecked: Date.now()
              });
              
              if (connectionStatus.success) {
                toast({
                  title: "API Connected",
                  description: "Default API key is working properly.",
                });
              } else {
                toast({
                  title: "API Connection Issue",
                  description: connectionStatus.message,
                  variant: "destructive"
                });
              }
            } else {
              console.warn('API key verification failed - localStorage may be blocked');
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
            }
          }, 500);
        } catch (error) {
          console.error('Failed to set default API key:', error);
          setKeyStatus({
            isValidating: false,
            isValid: false,
            message: 'Failed to set default API key',
            lastChecked: Date.now()
          });
          toast({
            title: "API Key Error",
            description: "Failed to set default API key. Please try entering one manually.",
            variant: "destructive"
          });
        }
      } else {
        // If key exists, test the connection
        setKeyStatus(prev => ({ ...prev, isValidating: true }));
        const connectionStatus = await connectionTester.testApiConnection();
        
        setKeyStatus({
          isValidating: false,
          isValid: connectionStatus.success,
          message: connectionStatus.message,
          lastChecked: Date.now()
        });
        
        // Only show toast for failures to avoid too many notifications
        if (!connectionStatus.success) {
          toast({
            title: "API Connection Issue",
            description: connectionStatus.message,
            variant: "destructive"
          });
        }
      }
    };
    
    // Call immediately
    checkApiKey();
    
    // Also set up an interval to periodically check (helpful for production environments)
    const interval = setInterval(async () => {
      // Only recheck if the last check was more than 5 minutes ago
      if (Date.now() - keyStatus.lastChecked > 5 * 60 * 1000) {
        const hasKey = hasGrokApiKey();
        setIsGrokApiKeySet(hasKey);
        
        if (hasKey) {
          const connectionStatus = await connectionTester.testApiConnection();
          
          // Only update if status changed to avoid unnecessary rerenders
          if (connectionStatus.success !== keyStatus.isValid || 
              connectionStatus.message !== keyStatus.message) {
            setKeyStatus({
              isValidating: false,
              isValid: connectionStatus.success,
              message: connectionStatus.message,
              lastChecked: Date.now()
            });
            
            // Alert user if API connection was working but is now failing
            if (keyStatus.isValid && !connectionStatus.success) {
              toast({
                title: "API Connection Lost",
                description: connectionStatus.message,
                variant: "destructive"
              });
            }
          }
        }
      }
    }, 60000); // Check every minute but respect the 5-minute cooldown
    
    return () => clearInterval(interval);
  }, [toast, keyStatus.isValid, keyStatus.message, keyStatus.lastChecked]);

  const handleSaveApiKeys = async () => {
    if (grokApiKeyInput.trim()) {
      try {
        // First validate the new API key before saving
        setKeyStatus(prev => ({ ...prev, isValidating: true }));
        // Use testApiConnection instead of the non-existent testApiKeyValidity
        const keyValidation = await connectionTester.testApiConnection(grokApiKeyInput.trim());
        
        if (keyValidation.success) {
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
                description: `Your Grok API key has been saved and validated.`,
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
    keyStatus
  };
};
