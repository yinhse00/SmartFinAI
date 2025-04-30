
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
    
    // Add window event listener for CORS errors
    const originalOnError = window.onerror;
    window.onerror = function(message, source, line, column, error) {
      // Check for common CORS error patterns
      if (typeof message === 'string' && 
         (message.includes('CORS') || 
          message.includes('cross-origin') || 
          message.includes('Cross-Origin') || 
          message.includes('NetworkError'))) {
        console.error('CORS error detected:', message);
        toast({
          title: "Network Request Issue",
          description: "A CORS-related error was detected. The system will use proxy settings to avoid this issue.",
          duration: 5000,
        });
      }
      
      // Call original handler if it exists
      if (originalOnError) {
        return originalOnError(message, source, line, column, error);
      }
      return false;
    };
    
    const intervalCheck = setInterval(() => {
      const key = getGrokApiKey();
      if (!key || !key.startsWith('xai-') || key.length < 20) {
        console.warn('Periodic check: API key missing or invalid, attempting to fix');
        checkAndSetApiKey();
      }
    }, 60000);
    
    return () => {
      clearInterval(intervalCheck);
      window.onerror = originalOnError; // Restore original handler
    };
  }, [toast]);

  return (
    <MainLayout>
      <ChatInterface />
    </MainLayout>
  );
};

export default Chat;
