
import SidebarLayout from '@/components/layout/SidebarLayout';
import ChatInterface from '@/components/chat/ChatInterface';
import { useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { hasGrokApiKey, getGrokApiKey, setGrokApiKey, hasGoogleApiKey } from '@/services/apiKeyService';
import { getFeatureAIPreference } from '@/services/ai/aiPreferences';
import { AIProvider } from '@/types/aiProvider';

const Chat = () => {
  const { toast } = useToast();
  const [demoMode, setDemoMode] = useState(false);
  
  useEffect(() => {
    // Check API key based on user's preferred provider
    const checkApiKey = () => {
      try {
        // Get user's AI preference for chat
        const chatPreference = getFeatureAIPreference('chat');
        
        let hasValidKey = false;
        if (chatPreference.provider === AIProvider.GROK) {
          const currentApiKey = getGrokApiKey();
          hasValidKey = currentApiKey && 
                       currentApiKey.startsWith('xai-') && 
                       currentApiKey.length >= 20;
        } else if (chatPreference.provider === AIProvider.GOOGLE) {
          hasValidKey = hasGoogleApiKey();
        }
        
        if (hasValidKey) {
          console.log(`Valid ${chatPreference.provider} API key found`);
          setDemoMode(false);
        } else {
          console.log(`No valid ${chatPreference.provider} API key available`);
          setDemoMode(true);
        }
      } catch (e) {
        console.error('Error checking API key:', e);
        setDemoMode(true);
      }
    };
    
    // Check once on mount
    checkApiKey();
    
    // Listen for storage changes to update when user changes API keys in profile
    const handleStorageChange = () => {
      checkApiKey();
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  return (
    <SidebarLayout>
      <div className="container mx-auto px-4 py-8">
        <ChatInterface demoMode={demoMode} />
      </div>
    </SidebarLayout>
  );
};

export default Chat;
