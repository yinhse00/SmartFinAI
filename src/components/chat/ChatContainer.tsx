
import React, { useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import ChatHeader from './ChatHeader';
import ChatHistory from './ChatHistory';
import ChatInput from './ChatInput';
import { Message } from './ChatMessage';

interface ChatContainerProps {
  messages: Message[];
  isLoading: boolean;
  isGrokApiKeySet: boolean;
  input: string;
  setInput: (input: string) => void;
  handleSend: () => void;
  handleKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onOpenApiKeyDialog: () => void;
  retryLastQuery?: () => void;
}

const ChatContainer: React.FC<ChatContainerProps> = ({
  messages,
  isLoading,
  isGrokApiKeySet,
  input,
  setInput,
  handleSend,
  handleKeyDown,
  onOpenApiKeyDialog,
  retryLastQuery
}) => {
  // Ref for chat history container
  const chatHistoryRef = useRef<HTMLDivElement>(null);

  return (
    <Card className="finance-card h-full flex flex-col">
      <ChatHeader 
        isGrokApiKeySet={isGrokApiKeySet} 
        onOpenApiKeyDialog={onOpenApiKeyDialog} 
      />
      <CardContent 
        className="flex-1 overflow-hidden p-0 max-h-[calc(100vh-25rem)] min-h-[400px] flex flex-col" 
        ref={chatHistoryRef}
      >
        <ChatHistory 
          messages={messages} 
          isLoading={isLoading} 
          onRetry={retryLastQuery}
        />
      </CardContent>
      <ChatInput 
        input={input}
        setInput={setInput}
        handleSend={handleSend}
        isLoading={isLoading}
        isGrokApiKeySet={isGrokApiKeySet}
        onOpenApiKeyDialog={onOpenApiKeyDialog}
        handleKeyDown={handleKeyDown}
      />
    </Card>
  );
};

export default ChatContainer;
