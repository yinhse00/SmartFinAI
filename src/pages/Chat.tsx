
import MainLayout from '@/components/layout/MainLayout';
import ChatInterface from '@/components/chat/ChatInterface';
import { ExternalLink } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { hasGrokApiKey, getGrokApiKey, setGrokApiKey } from '@/services/apiKeyService';

const Chat = () => {
  const { toast } = useToast();
  const [demoMode, setDemoMode] = useState(false); // Default to production mode
  
  // Check for Grok API key when the component mounts and set a default if needed
  useEffect(() => {
    const checkAndSetApiKey = () => {
      const apiKeyExists = hasGrokApiKey();
      
      if (!apiKeyExists) {
        // Try to set a default API key for production environments
        try {
          // CONSISTENCY FIX: Always use a properly formatted API key
          const defaultApiKey = 'xai-VDZl0d1KOqa1a6od7PwcSJa8H6voWmnmPo1P97ElrW2JHHD7pF3kFxm7Ii5Or6SdhairQkgBlQ1zOci3';
          setGrokApiKey(defaultApiKey);
          console.log('Default API key set for production environment');
          
          // Verify key was actually stored by reading it back
          setTimeout(() => {
            const storedKey = getGrokApiKey();
            if (storedKey && storedKey === defaultApiKey) {
              console.log('API key verification successful');
              setDemoMode(false);
            } else {
              console.warn('API key storage verification failed');
              setDemoMode(true);
              
              // Try one more time with another method
              localStorage.setItem('grokApiKey', defaultApiKey);
              console.log('Attempted alternative storage method for API key');
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
        
        // CONSISTENCY FIX: If key doesn't have valid format, try to fix it
        if (!isValidFormat && apiKey) {
          console.warn('Invalid API key format detected, attempting to set default key');
          const defaultApiKey = 'xai-VDZl0d1KOqa1a6od7PwcSJa8H6voWmnmPo1P97ElrW2JHHD7pF3kFxm7Ii5Or6SdhairQkgBlQ1zOci3';
          setGrokApiKey(defaultApiKey);
          
          // Double check it worked
          setTimeout(() => {
            if (getGrokApiKey() === defaultApiKey) {
              console.log('Successfully fixed API key format');
              setDemoMode(false);
            }
          }, 100);
        }
      }
    };
    
    // Execute the check immediately
    checkAndSetApiKey();
    
    // Also set up a safety check after a short delay (useful for production environments)
    const safetyCheck = setTimeout(() => {
      if (!hasGrokApiKey()) {
        console.warn('Safety check: No API key detected after initial setup');
        checkAndSetApiKey();
      }
    }, 2000);
    
    return () => clearTimeout(safetyCheck);
  }, [toast]);

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
        </p>
      </div>
      
      <ChatInterface />
    </MainLayout>
  );
};

export default Chat;
