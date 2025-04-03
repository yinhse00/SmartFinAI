
import MainLayout from '@/components/layout/MainLayout';
import ChatInterface from '@/components/chat/ChatInterface';
import { ExternalLink } from 'lucide-react';
import { useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { setGrokApiKey, hasGrokApiKey } from '@/services/apiKeyService';

const Chat = () => {
  const { toast } = useToast();
  
  // Set the Grok API key when the component mounts
  useEffect(() => {
    // Only set if not already set
    if (!hasGrokApiKey()) {
      // Using a mock API key since we're using fallback responses
      const defaultApiKey = 'mock-api-key-for-demonstration';
      setGrokApiKey(defaultApiKey);
      
      toast({
        title: "Demo Mode Active",
        description: "Using fallback responses since Grok API is not accessible directly from client-side.",
        duration: 5000,
      });
    }
  }, [toast]);

  return (
    <MainLayout>
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-finance-dark-blue dark:text-white">Regulatory Assistant</h1>
        <p className="text-gray-600 dark:text-gray-300 flex items-center gap-1">
          Ask questions about Hong Kong listing rules, takeovers code, and compliance requirements.
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
        </p>
      </div>
      
      <ChatInterface defaultProvider="grok" />
    </MainLayout>
  );
};

export default Chat;
