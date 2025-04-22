import MainLayout from '@/components/layout/MainLayout';
import ChatInterface from '@/components/chat/ChatInterface';
import { useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { hasGrokApiKey, getGrokApiKey, setGrokApiKey } from '@/services/apiKeyService';

const Chat = () => {
  const { toast } = useToast();
  const [demoMode, setDemoMode] = useState(false);
  
  useEffect(() => {
    const checkAndSetApiKey = () => {
      try {
        const currentApiKey = getGrokApiKey();
        const isValidKey = currentApiKey && 
                          currentApiKey.startsWith('xai-') && 
                          currentApiKey.length >= 20;
        
        if (isValidKey) {
          console.log('Valid API key already exists');
          setDemoMode(false);
          return;
        }
        
        if (currentApiKey && (!currentApiKey.startsWith('xai-') || currentApiKey.length < 20)) {
          console.warn('Invalid API key format detected, clearing');
          try {
            localStorage.removeItem('GROK_API_KEY');
            localStorage.removeItem('grokApiKey');
          } catch (e) {
            console.error('Failed to clear invalid API keys', e);
          }
        }
        
        const defaultApiKey = 'xai-VDZl0d1KOqa1a6od7PwcSJa8H6voWmnmPo1P97ElrW2JHHD7pF3kFxm7Ii5Or6SdhairQkgBlQ1zOci3';
        
        try {
          localStorage.setItem('GROK_API_KEY', defaultApiKey);
          localStorage.setItem('grokApiKey', defaultApiKey);
          setGrokApiKey(defaultApiKey);
          
          console.log('Default API key set');
          
          setTimeout(() => {
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
          setDemoMode(false);
        }
      } catch (e) {
        console.error('Error in API key handling:', e);
      }
    };
    
    checkAndSetApiKey();
    setTimeout(checkAndSetApiKey, 500);
    
    const intervalCheck = setInterval(() => {
      const key = getGrokApiKey();
      if (!key || !key.startsWith('xai-') || key.length < 20) {
        console.warn('Periodic check: API key missing or invalid, attempting to fix');
        checkAndSetApiKey();
      }
    }, 60000);
    
    return () => {
      clearInterval(intervalCheck);
    };
  }, [toast]);

  return (
    <MainLayout>
      <div className="space-y-6">
        <ChatInterface />
      </div>
    </MainLayout>
  );
};

export default Chat;
