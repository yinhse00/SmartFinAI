
import { useEffect } from 'react';
import { hasGrokApiKey, setGrokApiKey } from '@/services/apiKeyService';
import { useToast } from '@/hooks/use-toast';
import { KeyStatus } from './useApiKeyValidation';
import { connectionTester } from '@/services/api/grok/connectionTester';

interface UseApiKeyInitializationProps {
  setIsGrokApiKeySet: (value: boolean) => void;
  setKeyStatus: (value: KeyStatus | ((prev: KeyStatus) => KeyStatus)) => void;
  keyStatus: KeyStatus;
}

export const useApiKeyInitialization = ({ 
  setIsGrokApiKeySet, 
  setKeyStatus, 
  keyStatus 
}: UseApiKeyInitializationProps) => {
  const { toast } = useToast();

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
  }, [toast, keyStatus.isValid, keyStatus.message, keyStatus.lastChecked, setIsGrokApiKeySet, setKeyStatus]);
};
