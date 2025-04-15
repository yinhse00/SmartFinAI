
import { useState, useEffect } from 'react';
import { hasGrokApiKey, setGrokApiKey } from '@/services/apiKeyService';
import { useToast } from '@/hooks/use-toast';

/**
 * Hook to manage API key state
 */
export const useApiKeyState = () => {
  const [grokApiKeyInput, setGrokApiKeyInput] = useState('');
  const [isGrokApiKeySet, setIsGrokApiKeySet] = useState(false);
  const [apiKeyDialogOpen, setApiKeyDialogOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const hasGrokKey = hasGrokApiKey();
    setIsGrokApiKeySet(hasGrokKey);
    
    if (!hasGrokKey) {
      setApiKeyDialogOpen(true);
    }
  }, []);

  const handleSaveApiKeys = () => {
    if (grokApiKeyInput.trim()) {
      setGrokApiKey(grokApiKeyInput.trim());
      setIsGrokApiKeySet(true);
      toast({
        title: "API Key Saved",
        description: "Your Grok API key has been saved. You can now use our specialized financial expertise service.",
      });
    } else {
      toast({
        title: "API Key Required",
        description: "Please enter a valid Grok API key to access professional financial expertise.",
        variant: "destructive"
      });
      return;
    }
    
    setApiKeyDialogOpen(false);
  };

  return {
    grokApiKeyInput,
    setGrokApiKeyInput,
    isGrokApiKeySet,
    setIsGrokApiKeySet,
    apiKeyDialogOpen,
    setApiKeyDialogOpen,
    handleSaveApiKeys
  };
};
