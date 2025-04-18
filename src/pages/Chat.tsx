
import MainLayout from '@/components/layout/MainLayout';
import ChatInterface from '@/components/chat/ChatInterface';
import { BookOpen } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { hasGrokApiKey, getGrokApiKey, setGrokApiKey } from '@/services/apiKeyService';

const Chat = () => {
  const { toast } = useToast();
  const [demoMode, setDemoMode] = useState(false);
  
  // Check for Grok API key when the component mounts and set a default if needed
  useEffect(() => {
    const checkAndSetApiKey = () => {
      try {
        // First, check if a valid key already exists
        const currentApiKey = getGrokApiKey();
        const isValidKey = currentApiKey && 
                          currentApiKey.startsWith('xai-') && 
                          currentApiKey.length >= 20;
        
        if (isValidKey) {
          console.log('Valid API key already exists');
          setDemoMode(false);
          return;
        }
        
        // Clear any problematic API keys
        if (currentApiKey && (!currentApiKey.startsWith('xai-') || currentApiKey.length < 20)) {
          console.warn('Invalid API key format detected, clearing');
          try {
            localStorage.removeItem('GROK_API_KEY');
            localStorage.removeItem('grokApiKey');
          } catch (e) {
            console.error('Failed to clear invalid API keys', e);
          }
        }
        
        // Always set a default API key for all environments
        const defaultApiKey = 'xai-VDZl0d1KOqa1a6od7PwcSJa8H6voWmnmPo1P97ElrW2JHHD7pF3kFxm7Ii5Or6SdhairQkgBlQ1zOci3';
        
        try {
          // Use both direct localStorage and service method for maximum compatibility
          localStorage.setItem('GROK_API_KEY', defaultApiKey);
          localStorage.setItem('grokApiKey', defaultApiKey);
          setGrokApiKey(defaultApiKey);
          
          console.log('Default API key set');
          
          // Force a delay before checking to ensure storage has completed
          setTimeout(() => {
            // Double-check that the key was actually stored
            const storedKey = getGrokApiKey();
            console.log('API Key verification:', {
              keySet: !!storedKey,
              keyValid: storedKey && storedKey.startsWith('xai-') && storedKey.length >= 20,
              keyMatches: storedKey === defaultApiKey
            });
            
            if (!storedKey || storedKey !== defaultApiKey) {
              console.warn('API key storage verification failed');
              setDemoMode(true);
            } else {
              setDemoMode(false);
            }
          }, 300);
        } catch (error) {
          console.error('Failed to set default API key:', error);
          // Even if localStorage fails, we're still in a valid state
          // because getGrokApiKey will return the default key
          setDemoMode(false);
        }
      } catch (e) {
        console.error('Error in API key handling:', e);
      }
    };
    
    // Execute the check immediately and after a safety delay
    checkAndSetApiKey();
    
    // Add periodic checks for API key validity
    const intervalCheck = setInterval(() => {
      const key = getGrokApiKey();
      // Log key status but don't spam console
      if (!key || !key.startsWith('xai-') || key.length < 20) {
        console.warn('Periodic check: API key missing or invalid, attempting to fix');
        checkAndSetApiKey();
      }
    }, 60000); // Check every minute
    
    return () => {
      clearInterval(intervalCheck);
    };
  }, [toast]);

  return (
    <MainLayout>
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-finance-dark-blue dark:text-white">SmartFinAI</h1>
        <p className="text-gray-600 dark:text-gray-300 flex items-center gap-1">
          Your expert assistant for Hong Kong listing rules, takeovers code, and compliance requirements.
          {demoMode && (
            <span className="ml-1 text-sm bg-finance-highlight/40 dark:bg-finance-medium-blue/30 px-2 py-0.5 rounded-full flex items-center gap-1">
              Demo Mode
            </span>
          )}
        </p>
      </div>
      
      <ChatInterface />
    </MainLayout>
  );
};

export default Chat;
