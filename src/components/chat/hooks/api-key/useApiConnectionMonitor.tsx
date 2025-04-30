
import { useEffect } from 'react';
import { hasGrokApiKey } from '@/services/apiKeyService';
import { useToast } from '@/hooks/use-toast';
import { connectionTester } from '@/services/api/grok/connectionTester';

/**
 * Hook for monitoring API connection status periodically
 */
export const useApiConnectionMonitor = (
  setIsGrokApiKeySet: (value: boolean) => void,
  setKeyStatus: (value: any) => void,
  keyStatus: {
    isValidating: boolean;
    isValid: boolean | null;
    message: string;
    lastChecked: number;
  }
) => {
  const { toast } = useToast();

  // Set up periodic connection monitoring
  useEffect(() => {
    const monitorConnection = async () => {
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
    };
    
    // Monitor connection periodically
    const interval = setInterval(monitorConnection, 60000); // Check every minute but respect the 5-minute cooldown
    
    return () => clearInterval(interval);
  }, [toast, keyStatus.isValid, keyStatus.message, keyStatus.lastChecked, setIsGrokApiKeySet, setKeyStatus]);
};
