import MainLayout from '@/components/layout/MainLayout';
import ChatInterface from '@/components/chat/ChatInterface';
import { useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { hasGrokApiKey, getGrokApiKey, setGrokApiKey } from '@/services/apiKeyService';
import { grokApiService } from '@/services/api/grokApiService';

const Chat = () => {
  const { toast } = useToast();
  const [demoMode, setDemoMode] = useState(false);
  const [isOfflineMode, setIsOfflineMode] = useState(false);
  
  useEffect(() => {
    const checkAndSetApiKey = async () => {
      try {
        const currentApiKey = getGrokApiKey();
        const isValidKey = currentApiKey && 
                          currentApiKey.startsWith('xai-') && 
                          currentApiKey.length >= 20;
        
        if (isValidKey) {
          console.log('Valid API key already exists');
          setDemoMode(false);
          
          // Check if the API is actually reachable
          try {
            const connectionStatus = await grokApiService.testApiConnection(currentApiKey);
            setIsOfflineMode(!connectionStatus.success);
            
            if (!connectionStatus.success) {
              console.warn('API connection test failed:', connectionStatus.message);
              toast({
                title: "Operating in Offline Mode",
                description: "The Grok API is currently unreachable. Limited functionality available.",
                variant: "destructive",
              });
            }
          } catch (connectionError) {
            console.error("API connection test failed:", connectionError);
            setIsOfflineMode(true);
          }
          
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
        setIsOfflineMode(true);
        console.log('No valid API key available');
        
        setTimeout(() => {
          const storedKey = getGrokApiKey();
          if (!storedKey || !storedKey.startsWith('xai-') || storedKey.length < 20) {
            setDemoMode(true);
            setIsOfflineMode(true);
          } else {
            setDemoMode(false);
          }
        }, 300);
        
      } catch (e) {
        console.error('Error in API key handling:', e);
        setIsOfflineMode(true);
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

  const tryReconnect = async (): Promise<boolean> => {
    const apiKey = getGrokApiKey();
    if (!apiKey) {
      toast({
        title: "API Key Required",
        description: "Please set your Grok API key to connect.",
        variant: "destructive"
      });
      return false; // Return false if no API key
    }
    
    toast({
      title: "Checking Connection",
      description: "Attempting to reconnect to the Grok API..."
    });
    
    try {
      const connectionStatus = await grokApiService.testApiConnection(apiKey);
      if (connectionStatus.success) {
        setIsOfflineMode(false);
        toast({
          title: "Connection Restored",
          description: "Successfully reconnected to the Grok API.",
        });
        return true; // Return true if connection is successful
      } else {
        toast({
          title: "Connection Failed",
          description: connectionStatus.message || "Could not connect to the Grok API.",
          variant: "destructive"
        });
        return false; // Return false if connection fails
      }
    } catch (error) {
      console.error("Reconnection attempt failed:", error);
      toast({
        title: "Connection Failed",
        description: error instanceof Error ? error.message : "Could not connect to the Grok API.",
        variant: "destructive"
      });
      return false; // Return false if there's an error
    }
  };

  return (
    <MainLayout>
      <ChatInterface isOfflineMode={isOfflineMode} onTryReconnect={tryReconnect} />
    </MainLayout>
  );
};

export default Chat;
