
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { hasGrokApiKey, getGrokApiKey, setGrokApiKey } from '@/services/apiKeyService';

export const useApiKeyState = () => {
  const { toast } = useToast();
  const [grokApiKeyInput, setGrokApiKeyInput] = useState('');
  const [isGrokApiKeySet, setIsGrokApiKeySet] = useState(false);
  const [apiKeyDialogOpen, setApiKeyDialogOpen] = useState(false);
  
  useEffect(() => {
    const checkApiKey = () => {
      const hasApiKey = hasGrokApiKey();
      setIsGrokApiKeySet(hasApiKey);
      
      if (!hasApiKey) {
        console.log('No API key found, showing dialog');
        setTimeout(() => setApiKeyDialogOpen(true), 1000);
      }
    };
    
    checkApiKey();
  }, []);
  
  const handleSaveApiKeys = () => {
    if (grokApiKeyInput.trim() && grokApiKeyInput.startsWith('xai-')) {
      setGrokApiKey(grokApiKeyInput.trim());
      setIsGrokApiKeySet(true);
      setApiKeyDialogOpen(false);
      
      toast({
        title: 'API Key Saved',
        description: 'Your Grok API key has been saved successfully.',
      });
    } else {
      toast({
        title: 'Invalid API Key',
        description: 'Please enter a valid Grok API key starting with "xai-".',
        variant: 'destructive',
      });
    }
  };
  
  return {
    grokApiKeyInput,
    setGrokApiKeyInput,
    isGrokApiKeySet,
    apiKeyDialogOpen,
    setApiKeyDialogOpen,
    handleSaveApiKeys
  };
};
