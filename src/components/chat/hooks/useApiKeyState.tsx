
import { useState } from 'react';
import { useApiKeyValidation } from './api-key/useApiKeyValidation';
import { useApiKeyInitialization } from './api-key/useApiKeyInitialization';
import { useApiKeySave } from './api-key/useApiKeySave';

/**
 * Enhanced hook to manage API key state with advanced validation
 */
export const useApiKeyState = () => {
  const [grokApiKeyInput, setGrokApiKeyInput] = useState('');
  const [isGrokApiKeySet, setIsGrokApiKeySet] = useState(false);
  const [apiKeyDialogOpen, setApiKeyDialogOpen] = useState(false);
  
  // Use our validation hook
  const { 
    keyStatus, 
    setKeyStatus, 
    testApiConnection 
  } = useApiKeyValidation();
  
  // Initialize API key
  useApiKeyInitialization({ 
    setIsGrokApiKeySet, 
    setKeyStatus, 
    keyStatus 
  });
  
  // API key saving functionality
  const { handleSaveApiKeys } = useApiKeySave({
    setIsGrokApiKeySet,
    setApiKeyDialogOpen
  });

  const handleSaveApiKeyWrapper = async () => {
    await handleSaveApiKeys(grokApiKeyInput);
  };

  return {
    grokApiKeyInput,
    setGrokApiKeyInput,
    isGrokApiKeySet,
    setIsGrokApiKeySet,
    apiKeyDialogOpen,
    setApiKeyDialogOpen,
    handleSaveApiKeys: handleSaveApiKeyWrapper,
    keyStatus
  };
};
