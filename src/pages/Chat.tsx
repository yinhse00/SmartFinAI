
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
        
        // For security reasons, don't hardcode API keys - user should provide them
        setDemoMode(true);
        console.log('No valid API key available');
        
        setTimeout(() => {
          const storedKey = getGrokApiKey();
          if (!storedKey || !storedKey.startsWith('xai-') || storedKey.length < 20) {
            setDemoMode(true);
          } else {
            setDemoMode(false);
          }
        }, 300);
        
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
      <div className="w-full h-full flex">
        <ChatInterface />
      </div>
    </MainLayout>
  );
};

export default Chat;
