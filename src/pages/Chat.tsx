
import MainLayout from '@/components/layout/MainLayout';
import ChatInterface from '@/components/chat/ChatInterface';
import { ExternalLink } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { hasGrokApiKey, getGrokApiKey, setGrokApiKey } from '@/services/apiKeyService';

const Chat = () => {
  const { toast } = useToast();
  const [demoMode, setDemoMode] = useState(false);
  
  // Check for Grok API key when the component mounts and set a default if needed
  useEffect(() => {
    const checkAndSetApiKey = () => {
      // CRITICAL FIX: Clear any problematic API keys from localStorage to start fresh
      try {
        const currentApiKey = getGrokApiKey();
        if (currentApiKey && !currentApiKey.startsWith('xai-')) {
          console.warn('Invalid API key format detected, clearing');
          localStorage.removeItem('GROK_API_KEY');
        }
      } catch (e) {
        console.error('Error checking existing API key:', e);
      }
      
      const apiKeyExists = hasGrokApiKey();
      
      if (!apiKeyExists) {
        // Try to set a default API key for all environments
        try {
          const defaultApiKey = 'xai-VDZl0d1KOqa1a6od7PwcSJa8H6voWmnmPo1P97ElrW2JHHD7pF3kFxm7Ii5Or6SdhairQkgBlQ1zOci3';
          
          // CRITICAL FIX: Use multiple storage methods to ensure it works across environments
          localStorage.setItem('GROK_API_KEY', defaultApiKey);
          setGrokApiKey(defaultApiKey);
          
          console.log('Default API key set');
          
          // Verify key was actually stored by reading it back
          setTimeout(() => {
            const storedKey = getGrokApiKey();
            if (storedKey && storedKey === defaultApiKey) {
              console.log('API key verification successful');
              setDemoMode(false);
            } else {
              console.warn('API key storage verification failed');
              setDemoMode(true);
              
              // Try direct localStorage access as fallback
              try {
                localStorage.setItem('grokApiKey', defaultApiKey);
                localStorage.setItem('GROK_API_KEY', defaultApiKey);
                console.log('Attempted alternative storage methods for API key');
                
                // Check if either method worked
                if (localStorage.getItem('grokApiKey') === defaultApiKey || 
                    localStorage.getItem('GROK_API_KEY') === defaultApiKey) {
                  setDemoMode(false);
                }
              } catch (e) {
                console.error('localStorage fallback failed:', e);
              }
            }
          }, 100);
        } catch (error) {
          console.error('Failed to set default API key:', error);
          setDemoMode(true);
          toast({
            title: "No API Key Detected",
            description: "You'll need to set your Grok API key to connect to the service.",
            duration: 5000,
          });
        }
      } else {
        // API key exists, verify it starts with expected prefix
        const apiKey = getGrokApiKey();
        const isValidFormat = apiKey && apiKey.startsWith('xai-');
        setDemoMode(!isValidFormat);
        
        if (!isValidFormat && apiKey) {
          console.warn('Invalid API key format detected, attempting to set default key');
          const defaultApiKey = 'xai-VDZl0d1KOqa1a6od7PwcSJa8H6voWmnmPo1P97ElrW2JHHD7pF3kFxm7Ii5Or6SdhairQkgBlQ1zOci3';
          
          // Try multiple storage methods
          try {
            localStorage.setItem('GROK_API_KEY', defaultApiKey);
            setGrokApiKey(defaultApiKey);
            
            // Double check it worked
            setTimeout(() => {
              if (getGrokApiKey() === defaultApiKey) {
                console.log('Successfully fixed API key format');
                setDemoMode(false);
              }
            }, 100);
          } catch (e) {
            console.error('Failed to fix API key:', e);
          }
        }
      }
    };
    
    // Execute the check immediately
    checkAndSetApiKey();
    
    // Also set up a safety check after a short delay
    const safetyCheck = setTimeout(() => {
      if (!hasGrokApiKey()) {
        console.warn('Safety check: No API key detected after initial setup');
        checkAndSetApiKey();
      }
    }, 2000);
    
    // CRITICAL FIX: Add periodic check for API key validity
    const intervalCheck = setInterval(() => {
      const key = getGrokApiKey();
      if (!key || !key.startsWith('xai-')) {
        console.warn('Periodic check: API key missing or invalid, attempting to fix');
        checkAndSetApiKey();
      }
    }, 30000);
    
    return () => {
      clearTimeout(safetyCheck);
      clearInterval(intervalCheck);
    };
  }, [toast]);

  // CRITICAL FIX: Add debug component that shows current API key status
  const debugApiKey = () => {
    try {
      const key = getGrokApiKey();
      console.log('Current API key:', key ? `${key.substring(0, 8)}...` : 'none');
      console.log('API key valid format:', key && key.startsWith('xai-'));
      console.log('Environment:', window.location.href.includes('localhost') ? 'development' : 'production');
      console.log('URL:', window.location.href);
      
      toast({
        title: "API Key Status",
        description: key ? "API key is set" : "No API key found",
      });
    } catch (e) {
      console.error('Error checking API key:', e);
    }
  };

  return (
    <MainLayout>
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-finance-dark-blue dark:text-white">Regulatory Assistant</h1>
        <p className="text-gray-600 dark:text-gray-300 flex items-center gap-1">
          Ask questions about Hong Kong listing rules, takeovers code, and compliance requirements.
          {demoMode && (
            <span className="ml-1 text-sm bg-finance-highlight/40 dark:bg-finance-medium-blue/30 px-2 py-0.5 rounded-full flex items-center gap-1">
              Demo Mode
              <a 
                href="https://www.grok.x.ai/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-finance-medium-blue dark:text-finance-accent-blue font-medium flex items-center gap-0.5 hover:underline"
              >
                Grok AI <ExternalLink size={12} />
              </a>
            </span>
          )}
          
          {/* Hidden link for debug purposes */}
          <span 
            onClick={debugApiKey}
            className="ml-2 opacity-0 hover:opacity-100 cursor-pointer text-xs text-gray-400"
          >
            debug
          </span>
        </p>
      </div>
      
      <ChatInterface />
    </MainLayout>
  );
};

export default Chat;
