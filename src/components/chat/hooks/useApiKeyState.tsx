
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
    // Check for API key on component mount
    const checkApiKey = () => {
      const hasGrokKey = hasGrokApiKey();
      setIsGrokApiKeySet(hasGrokKey);
      
      // If no key is set, set the default API key
      if (!hasGrokKey) {
        // Save the API key provided in the code for demo purposes
        const defaultApiKey = 'xai-VDZl0d1KOqa1a6od7PwcSJa8H6voWmnmPo1P97ElrW2JHHD7pF3kFxm7Ii5Or6SdhairQkgBlQ1zOci3';
        
        try {
          setGrokApiKey(defaultApiKey);
          setIsGrokApiKeySet(true);
          console.log('Default Grok API key set successfully');
          
          // Verify key is actually stored
          setTimeout(() => {
            const keyStored = hasGrokApiKey();
            if (!keyStored) {
              console.warn('API key verification failed - localStorage may be blocked');
              toast({
                title: "API Key Storage Issue",
                description: "Unable to store API key in browser storage. Private browsing mode may block storage.",
                variant: "destructive"
              });
            }
          }, 500);
        } catch (error) {
          console.error('Failed to set default API key:', error);
          toast({
            title: "API Key Error",
            description: "Failed to set default API key. Please try entering one manually.",
            variant: "destructive"
          });
        }
      }
    };
    
    // Call immediately
    checkApiKey();
    
    // Also set up an interval to periodically check (helpful for production environments)
    const interval = setInterval(checkApiKey, 60000); // Check every minute
    
    return () => clearInterval(interval);
  }, [toast]);

  const handleSaveApiKeys = () => {
    if (grokApiKeyInput.trim()) {
      try {
        setGrokApiKey(grokApiKeyInput.trim());
        
        // Verify key was actually stored
        setTimeout(() => {
          const keyStored = hasGrokApiKey();
          if (keyStored) {
            setIsGrokApiKeySet(true);
            toast({
              title: "API Key Saved",
              description: "Your Grok API key has been saved. You can now use our specialized financial expertise service.",
            });
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
      } catch (error) {
        console.error('Failed to save API key:', error);
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
    handleSaveApiKeys
  };
};
