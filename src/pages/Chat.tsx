
import MainLayout from '@/components/layout/MainLayout';
import ChatInterface from '@/components/chat/ChatInterface';
import { useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { hasGrokApiKey, getGrokApiKey, setGrokApiKey } from '@/services/apiKeyService';

const Chat = () => {
  const { toast } = useToast();
  const [demoMode, setDemoMode] = useState(false);
  
  useEffect(() => {
    // Single API key check on mount (no automatic intervals)
    const checkApiKey = () => {
      try {
        const currentApiKey = getGrokApiKey();
        const isValidKey = currentApiKey && 
                          currentApiKey.startsWith('xai-') && 
                          currentApiKey.length >= 20;
        
        if (isValidKey) {
          console.log('Valid API key found');
          setDemoMode(false);
        } else {
          console.log('No valid API key available');
          setDemoMode(true);
        }
      } catch (e) {
        console.error('Error checking API key:', e);
        setDemoMode(true);
      }
    };
    
    // Check once on mount
    checkApiKey();
  }, []);

  return (
    <MainLayout>
      <ChatInterface />
    </MainLayout>
  );
};

export default Chat;
