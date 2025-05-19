
import { useState, useEffect, useCallback } from 'react';
import { getGrokApiKey } from '@/services/apiKeyService';

export const useGrokConnection = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [isChecking, setIsChecking] = useState(false);

  const testConnection = useCallback(async () => {
    try {
      setIsChecking(true);
      // Simple API key validation - in a real app this would make an actual API call
      const apiKey = getGrokApiKey();
      const isValid = apiKey && apiKey.startsWith('xai-') && apiKey.length > 30;
      
      console.log('Testing Grok API connection...');
      
      // Simulate connection test
      setTimeout(() => {
        setIsConnected(isValid);
        setIsChecking(false);
        console.log(`Connection test ${isValid ? 'succeeded' : 'failed'}`);
      }, 500);
      
      return isValid;
    } catch (error) {
      console.error('Error testing connection:', error);
      setIsConnected(false);
      setIsChecking(false);
      return false;
    }
  }, []);

  // Initial connection test
  useEffect(() => {
    const apiKey = getGrokApiKey();
    if (apiKey && apiKey.startsWith('xai-') && apiKey.length > 30) {
      testConnection();
    }
  }, [testConnection]);

  return {
    isConnected,
    isChecking,
    testConnection
  };
};
