
import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { grokService } from '@/services/grokService';
import { useToast } from '@/hooks/use-toast';
import { getGrokApiKey, setGrokApiKey, hasGrokApiKey } from '@/services/apiKeyService';
import { extractReferences } from '@/services/contextUtils';

// Components
import ChatMessage, { Message } from './ChatMessage';
import ChatLoadingIndicator from './ChatLoadingIndicator';
import APIKeyDialog from './APIKeyDialog';
import KnowledgePanel from './KnowledgePanel';
import ChatInput from './ChatInput';
import ChatHeader from './ChatHeader';

interface ChatInterfaceProps {
  defaultProvider?: 'grok';
}

const ChatInterface = ({ defaultProvider = 'grok' }: ChatInterfaceProps) => {
  const [input, setInput] = useState('');
  const [grokApiKeyInput, setGrokApiKeyInput] = useState('');
  const [isGrokApiKeySet, setIsGrokApiKeySet] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: 'Hello! I\'m your Hong Kong regulatory assistant. How can I help you today?',
      sender: 'bot',
      timestamp: new Date(),
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [apiKeyDialogOpen, setApiKeyDialogOpen] = useState(false);
  const { toast } = useToast();

  // Check if API key is set on component mount
  useEffect(() => {
    const hasGrokKey = hasGrokApiKey();
    setIsGrokApiKeySet(hasGrokKey);
    
    // Open dialog if no API key
    if (!hasGrokKey) {
      setApiKeyDialogOpen(true);
    }
  }, []);

  const handleSaveApiKeys = () => {
    if (grokApiKeyInput.trim()) {
      setGrokApiKey(grokApiKeyInput.trim());
      setIsGrokApiKeySet(true);
    }
    
    setApiKeyDialogOpen(false);
    toast({
      title: "API Key Saved",
      description: "Your Grok API key has been saved in the browser's local storage.",
    });
  };

  const handleSend = async () => {
    if (!input.trim()) return;
    
    // Check if Grok API key is set
    if (!isGrokApiKeySet) {
      setApiKeyDialogOpen(true);
      return;
    }

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      content: input,
      sender: 'user',
      timestamp: new Date(),
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Get regulatory context for the query
      const regulatoryContext = await grokService.getRegulatoryContext(input);
      
      try {
        // Generate response using Grok
        const response = await grokService.generateResponse({
          prompt: input,
          regulatoryContext: regulatoryContext,
          temperature: 0.7,
          maxTokens: 500
        });
        
        // Check if we're using a fallback response (API call failed)
        const isUsingFallback = response.text.includes("Based on your query about") || 
                               response.text.includes("Regarding your query about") ||
                               response.text.includes("In response to your query");
        
        // Find references from the regulatory context
        const references = extractReferences(regulatoryContext);
        
        const botMessage: Message = {
          id: (Date.now() + 1).toString(),
          content: response.text,
          sender: 'bot',
          timestamp: new Date(),
          references: references,
          isUsingFallback: isUsingFallback
        };
        
        setMessages(prev => [...prev, botMessage]);
      } catch (error) {
        console.error("Error generating response:", error);
        toast({
          title: "Error",
          description: "Failed to generate a response. Please try again.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Error in chat process:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-14rem)]">
      <div className="flex-1 flex gap-4">
        {/* Chat Window */}
        <div className="flex-1 flex flex-col">
          <Card className="finance-card h-full flex flex-col">
            <ChatHeader 
              isGrokApiKeySet={isGrokApiKeySet} 
              onOpenApiKeyDialog={() => setApiKeyDialogOpen(true)} 
            />
            <CardContent className="flex-1 overflow-y-auto py-4 space-y-4">
              {messages.map((message) => (
                <ChatMessage key={message.id} message={message} />
              ))}
              {isLoading && <ChatLoadingIndicator />}
            </CardContent>
            <ChatInput 
              input={input}
              setInput={setInput}
              handleSend={handleSend}
              isLoading={isLoading}
              isGrokApiKeySet={isGrokApiKeySet}
              onOpenApiKeyDialog={() => setApiKeyDialogOpen(true)}
              handleKeyDown={handleKeyDown}
            />
          </Card>
        </div>

        {/* Knowledge Panel */}
        <KnowledgePanel />
      </div>

      {/* API Key Dialog */}
      <APIKeyDialog 
        open={apiKeyDialogOpen}
        onOpenChange={setApiKeyDialogOpen}
        grokApiKeyInput={grokApiKeyInput}
        setGrokApiKeyInput={setGrokApiKeyInput}
        onSave={handleSaveApiKeys}
      />
    </div>
  );
};

export default ChatInterface;
