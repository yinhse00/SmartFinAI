
import { useState } from 'react';
import { connectionTester } from '@/services/api/grok/connectionTester';
import { useToast } from '@/hooks/use-toast';

export type KeyStatus = {
  isValidating: boolean;
  isValid: boolean | null;
  message: string;
  lastChecked: number;
};

export const useApiKeyValidation = () => {
  const [keyStatus, setKeyStatus] = useState<KeyStatus>({
    isValidating: false,
    isValid: null,
    message: '',
    lastChecked: 0
  });
  
  const { toast } = useToast();

  const validateApiKey = async (apiKey: string): Promise<boolean> => {
    try {
      setKeyStatus(prev => ({ ...prev, isValidating: true }));
      const keyValidation = await connectionTester.testApiKeyValidity(apiKey.trim());
      
      setKeyStatus({
        isValidating: false,
        isValid: keyValidation.isValid,
        message: keyValidation.message,
        lastChecked: Date.now()
      });
      
      if (keyValidation.isValid) {
        toast({
          title: "API Key Valid",
          description: `API key validated successfully. ${keyValidation.quotaRemaining !== undefined ? `Quota remaining: ${keyValidation.quotaRemaining}` : ''}`,
        });
        return true;
      } else {
        toast({
          title: "Invalid API Key",
          description: keyValidation.message,
          variant: "destructive"
        });
        return false;
      }
    } catch (error) {
      console.error('API key validation error:', error);
      setKeyStatus({
        isValidating: false,
        isValid: false,
        message: error instanceof Error ? error.message : 'Unknown validation error',
        lastChecked: Date.now()
      });
      toast({
        title: "API Key Error",
        description: "Failed to validate API key. Please try again.",
        variant: "destructive"
      });
      return false;
    }
  };

  const testApiConnection = async (apiKey: string): Promise<boolean> => {
    setKeyStatus(prev => ({ ...prev, isValidating: true }));
    
    try {
      const connectionStatus = await connectionTester.testApiConnection(apiKey);
      
      setKeyStatus({
        isValidating: false,
        isValid: connectionStatus.success,
        message: connectionStatus.message,
        lastChecked: Date.now()
      });
      
      if (connectionStatus.success) {
        toast({
          title: "API Connected",
          description: "API key is working properly.",
        });
        return true;
      } else {
        toast({
          title: "API Connection Issue",
          description: connectionStatus.message,
          variant: "destructive"
        });
        return false;
      }
    } catch (error) {
      setKeyStatus({
        isValidating: false,
        isValid: false,
        message: error instanceof Error ? error.message : 'Unknown error occurred',
        lastChecked: Date.now()
      });
      toast({
        title: "API Connection Error",
        description: "Failed to test API connection. Please try again.",
        variant: "destructive"
      });
      return false;
    }
  };

  return {
    keyStatus,
    setKeyStatus,
    validateApiKey,
    testApiConnection
  };
};
