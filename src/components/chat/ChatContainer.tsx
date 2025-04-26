
import React from 'react';
import { Card } from '@/components/ui/card';
import ChatHeader from './ChatHeader';
import ChatContent from './components/ChatContent';
import ChatInput from './ChatInput';
import { Message } from './ChatMessage';
import TruncationWarning from './components/TruncationWarning';

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
  // Check if any messages are truncated
  const hasTruncatedMessages = messages.some(message => message.isTruncated);

  return (
    <Card className="finance-card h-full flex flex-col">
      <ChatHeader 
        isGrokApiKeySet={isGrokApiKeySet} 
        onOpenApiKeyDialog={onOpenApiKeyDialog} 
      />
      
      {hasTruncatedMessages && <TruncationWarning onRetry={retryLastQuery} />}
      
      <ChatContent 
        messages={messages}
        isLoading={isLoading}
        retryLastQuery={retryLastQuery}
      />
      
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
