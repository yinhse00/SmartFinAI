
import MainLayout from '@/components/layout/MainLayout';
import ChatInterface from '@/components/chat/ChatInterface';
import { ExternalLink } from 'lucide-react';
import { useEffect } from 'react';
import { grokService } from '@/services/grokService';
import { useToast } from '@/components/ui/use-toast';

const Chat = () => {
  const { toast } = useToast();
  
  // Set the Grok API key when the component mounts
  useEffect(() => {
    const apiKey = 'xai-d5jFAjxz2xujjhKYObAGbLFFGrxrM6DSUmOgQCoobSYJe6PWWgjJbgwZYJ190bAH9gniRNcMjezY4qi6';
    grokService.setApiKey(apiKey);
    
    // Show a toast notification that the API key has been set
    toast({
      title: "Grok API Key Set",
      description: "The Grok AI API key has been configured.",
      duration: 3000,
    });
  }, [toast]);

  return (
    <MainLayout>
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-finance-dark-blue dark:text-white">Regulatory Assistant</h1>
        <p className="text-gray-600 dark:text-gray-300 flex items-center gap-1">
          Ask questions about Hong Kong listing rules, takeovers code, and compliance requirements.
          <span className="ml-1 text-sm bg-finance-highlight/40 dark:bg-finance-medium-blue/30 px-2 py-0.5 rounded-full flex items-center gap-1">
            Powered by 
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
