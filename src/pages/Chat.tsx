
import MainLayout from '@/components/layout/MainLayout';
import ChatInterface from '@/components/chat/ChatInterface';
import { ExternalLink, AlertTriangle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { grokService } from '@/services/grokService';
import { useToast } from '@/components/ui/use-toast';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

const Chat = () => {
  const { toast } = useToast();
  const [showApiWarning, setShowApiWarning] = useState(false);
  
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
    
    // Check if we can actually connect to the API
    // For now we know there are CORS issues, so we'll show a warning
    setShowApiWarning(true);
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
      
      {showApiWarning && (
        <Alert variant="destructive" className="mb-4 bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800/50">
          <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-500" />
          <AlertTitle className="text-amber-800 dark:text-amber-500">API Connection Issue</AlertTitle>
          <AlertDescription className="text-amber-700 dark:text-amber-400">
            Currently unable to connect directly to Grok API due to browser security restrictions (CORS).
            The chat will use simulated responses. In a production environment, a server-side proxy would be used.
          </AlertDescription>
        </Alert>
      )}
      
      <ChatInterface defaultProvider="grok" />
    </MainLayout>
  );
};

export default Chat;
