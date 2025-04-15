
import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import KnowledgePanel from './KnowledgePanel';
import APIKeyDialog from './APIKeyDialog';
import ChatContainer from './ChatContainer';
import { useChatLogic } from './useChatLogic';
import { useToast } from '@/hooks/use-toast';

const ChatInterface = () => {
  const { toast } = useToast();
  const {
    input,
    setInput,
    grokApiKeyInput,
    setGrokApiKeyInput,
    isGrokApiKeySet,
    messages,
    isLoading,
    apiKeyDialogOpen,
    setApiKeyDialogOpen,
    handleSaveApiKeys,
    handleSend,
    handleKeyDown
  } = useChatLogic();

  // Monitor for incomplete responses and handle accordingly
  useEffect(() => {
    if (messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      // Check if the last message might be incomplete (ends abruptly)
      if (lastMessage.sender === 'bot' && 
          lastMessage.content && 
          lastMessage.content.length > 500 &&
          !lastMessage.content.endsWith('.') && 
          !lastMessage.content.endsWith('!') && 
          !lastMessage.content.endsWith('?') &&
          !lastMessage.content.includes('|---') && // Table format check
          !lastMessage.content.endsWith(':') &&
          !lastMessage.content.endsWith(';')) {
        
        // Only show this warning if it's not clearly a structured response
        if (!lastMessage.content.includes('|') && 
            !lastMessage.content.includes('T+') && 
            !lastMessage.content.includes('Timetable')) {
          toast({
            title: "Response Note",
            description: "The response may have been truncated. For detailed timetables, try specifying 'rights issue timetable' explicitly.",
            duration: 8000,
          });
        }
      }
    }
  }, [messages, toast]);

  return (
    <div className="flex flex-col h-[calc(100vh-14rem)]">
      <div className="flex-1 flex gap-4">
        {/* Financial Expert Chat Window */}
        <div className="flex-1 flex flex-col">
          <ChatContainer 
            messages={messages}
            isLoading={isLoading}
            isGrokApiKeySet={isGrokApiKeySet}
            input={input}
            setInput={setInput}
            handleSend={handleSend}
            handleKeyDown={handleKeyDown}
            onOpenApiKeyDialog={() => setApiKeyDialogOpen(true)}
          />
        </div>

        {/* Hong Kong Financial Knowledge Panel */}
        <KnowledgePanel />
      </div>

      {/* API Key Dialog for Financial Expert Access */}
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
