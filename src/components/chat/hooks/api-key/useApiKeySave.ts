
import { setGrokApiKey, hasGrokApiKey } from '@/services/apiKeyService';
import { useToast } from '@/hooks/use-toast';
import { useApiKeyValidation } from './useApiKeyValidation';

interface UseApiKeySaveProps {
  setIsGrokApiKeySet: (value: boolean) => void;
  setApiKeyDialogOpen: (value: boolean) => void;
}

export const useApiKeySave = ({ 
  setIsGrokApiKeySet, 
  setApiKeyDialogOpen 
}: UseApiKeySaveProps) => {
  const { toast } = useToast();
  const { validateApiKey, keyStatus } = useApiKeyValidation();
  
  const handleSaveApiKeys = async (apiKeyInput: string) => {
    if (!apiKeyInput.trim()) {
      toast({
        title: "API Key Required",
        description: "Please enter a valid Grok API key to access professional financial expertise.",
        variant: "destructive"
      });
      return;
    }
    
    try {
      // First validate the new API key before saving
      const isValid = await validateApiKey(apiKeyInput.trim());
      
      if (isValid) {
        setGrokApiKey(apiKeyInput.trim());
        
        // Verify key was actually stored
        setTimeout(async () => {
          const keyStored = hasGrokApiKey();
          if (keyStored) {
            setIsGrokApiKeySet(true);
            setApiKeyDialogOpen(false);
          } else {
            console.warn('API key verification failed - localStorage may be blocked');
            toast({
              title: "API Key Storage Issue",
              description: "Unable to store API key. Private browsing mode may block storage.",
              variant: "destructive"
            });
          }
        }, 500);
      }
    } catch (error) {
      console.error('Failed to save API key:', error);
      toast({
        title: "API Key Error",
        description: "Failed to save your API key. Please try again.",
        variant: "destructive"
      });
    }
  };

  return {
    handleSaveApiKeys,
    keyStatus
  };
};
