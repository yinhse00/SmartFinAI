
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { connectionTester } from '@/services/api/grok/connectionTester';

/**
 * Hook for handling API key validation
 */
export const useApiKeyValidation = () => {
  const [validationStatus, setValidationStatus] = useState<{
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

  /**
   * Validate a specific API key
   */
  const validateApiKey = async (apiKey: string): Promise<{ isValid: boolean; message: string }> => {
    try {
      setValidationStatus(prev => ({ ...prev, isValidating: true }));
      const keyValidation = await connectionTester.testApiKeyValidity(apiKey.trim());
      
      setValidationStatus({
        isValidating: false,
        isValid: keyValidation.success,
        message: keyValidation.message,
        lastChecked: Date.now()
      });

      return { 
        isValid: keyValidation.success, 
        message: keyValidation.message 
      };
    } catch (error) {
      console.error('Error validating API key:', error);
      
      setValidationStatus({
        isValidating: false,
        isValid: false,
        message: error instanceof Error ? error.message : 'Unknown validation error',
        lastChecked: Date.now()
      });
      
      return { 
        isValid: false, 
        message: error instanceof Error ? error.message : 'Unknown validation error' 
      };
    }
  };

  /**
   * Test the current API connection
   */
  const testApiConnection = async (): Promise<{ success: boolean; message: string }> => {
    try {
      setValidationStatus(prev => ({ ...prev, isValidating: true }));
      const connectionStatus = await connectionTester.testApiConnection();
      
      setValidationStatus({
        isValidating: false,
        isValid: connectionStatus.success,
        message: connectionStatus.message,
        lastChecked: Date.now()
      });
      
      if (!connectionStatus.success) {
        toast({
          title: "API Connection Issue",
          description: connectionStatus.message,
          variant: "destructive"
        });
      }
      
      return connectionStatus;
    } catch (error) {
      console.error('Error testing API connection:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error testing connection';
      
      setValidationStatus({
        isValidating: false,
        isValid: false,
        message: errorMessage,
        lastChecked: Date.now()
      });
      
      toast({
        title: "API Connection Error",
        description: errorMessage,
        variant: "destructive"
      });
      
      return { success: false, message: errorMessage };
    }
  };

  return {
    validationStatus,
    setValidationStatus,
    validateApiKey,
    testApiConnection
  };
};
