
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
      // CRITICAL FIX: Clear any problematic API keys from localStorage to start fresh
      try {
        const currentApiKey = getGrokApiKey();
        if (currentApiKey && (!currentApiKey.startsWith('xai-') || currentApiKey.length < 20)) {
          console.warn('Invalid API key format detected, clearing');
          localStorage.removeItem('GROK_API_KEY');
          localStorage.removeItem('grokApiKey');
        }
      } catch (e) {
        console.error('Error checking existing API key:', e);
      }
      
      const apiKeyExists = hasGrokApiKey();
      
      if (!apiKeyExists) {
        // Try to set a default API key for all environments
        try {
          // CRITICAL FIX: Use a stable API key format
          const defaultApiKey = 'xai-VDZl0d1KOqa1a6od7PwcSJa8H6voWmnmPo1P97ElrW2JHHD7pF3kFxm7Ii5Or6SdhairQkgBlQ1zOci3';
          
          // Use multiple storage methods to ensure it works across environments
          try {
            localStorage.setItem('GROK_API_KEY', defaultApiKey);
            localStorage.setItem('grokApiKey', defaultApiKey); // Alternative name
            setGrokApiKey(defaultApiKey); // Through service
            
            console.log('Default API key set');
            setDemoMode(false);
          } catch (e) {
            console.error('Error setting API key in localStorage:', e);
            setDemoMode(true);
          }
          
          // Verify key was actually stored by reading it back
          setTimeout(() => {
            const storedKey = getGrokApiKey();
            if (storedKey && storedKey === defaultApiKey) {
              console.log('API key verification successful');
              setDemoMode(false);
            } else {
              console.warn('API key storage verification failed');
              setDemoMode(true);
              
              // Try window.localStorage as direct fallback
              try {
                window.localStorage.setItem('GROK_API_KEY', defaultApiKey);
                window.localStorage.setItem('grokApiKey', defaultApiKey);
                console.log('Attempted global storage methods for API key');
                
                if (window.localStorage.getItem('GROK_API_KEY') === defaultApiKey) {
                  setDemoMode(false);
                  console.log('API key set using window.localStorage');
                }
              } catch (e) {
                console.error('All localStorage methods failed:', e);
              }
            }
          }, 300); // Longer timeout for verification
        } catch (error) {
          console.error('Failed to set default API key:', error);
          setDemoMode(true);
          toast({
            title: "No API Key Detected",
            description: "You'll need to set your API key to connect to the service.",
            duration: 5000,
          });
        }
      } else {
        // API key exists, verify format
        const apiKey = getGrokApiKey();
        const isValidFormat = apiKey && apiKey.startsWith('xai-') && apiKey.length >= 20;
        setDemoMode(!isValidFormat);
        
        if (!isValidFormat && apiKey) {
          console.warn('Invalid API key format detected, attempting to fix');
          try {
            // Try to recover by setting the default key again
            const defaultApiKey = 'xai-VDZl0d1KOqa1a6od7PwcSJa8H6voWmnmPo1P97ElrW2JHHD7pF3kFxm7Ii5Or6SdhairQkgBlQ1zOci3';
            localStorage.setItem('GROK_API_KEY', defaultApiKey);
            localStorage.setItem('grokApiKey', defaultApiKey); 
            setGrokApiKey(defaultApiKey);
            
            // Double check it worked
            setTimeout(() => {
              if (getGrokApiKey() === defaultApiKey) {
                console.log('Successfully fixed API key format');
                setDemoMode(false);
              }
            }, 200);
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
    
    // Add periodic check for API key validity
    const intervalCheck = setInterval(() => {
      const key = getGrokApiKey();
      if (!key || !key.startsWith('xai-') || key.length < 20) {
        console.warn('Periodic check: API key missing or invalid, attempting to fix');
        checkAndSetApiKey();
      }
    }, 30000);
    
    return () => {
      clearTimeout(safetyCheck);
      clearInterval(intervalCheck);
    };
  }, [toast]);

  // Debug function for API key status
  const debugApiKey = () => {
    try {
      const key = getGrokApiKey();
      console.log('Current API key:', key ? `${key.substring(0, 8)}...` : 'none');
      console.log('API key valid format:', key && key.startsWith('xai-') && key.length >= 20);
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
        <h1 className="text-2xl font-bold text-finance-dark-blue dark:text-white">SmartFinAI</h1>
        <p className="text-gray-600 dark:text-gray-300 flex items-center gap-1">
          Your expert assistant for Hong Kong listing rules, takeovers code, and compliance requirements.
          {demoMode && (
            <span className="ml-1 text-sm bg-finance-highlight/40 dark:bg-finance-medium-blue/30 px-2 py-0.5 rounded-full flex items-center gap-1">
              Demo Mode
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
