
import React from 'react';
import { Card } from '@/components/ui/card';
import ChatHeader from './ChatHeader';
import ChatContent from './content/ChatContent';
import ChatInput from './ChatInput';
import { Message } from './ChatMessage';
import { useLanguageDetection } from './hooks/useLanguageDetection';

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
  translatingMessageIds?: string[];
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
  retryLastQuery,
  translatingMessageIds = []
}) => {
  // Debug log to track message status
  if (translatingMessageIds.length > 0) {
    console.log(`Currently translating ${translatingMessageIds.length} messages: ${translatingMessageIds.join(', ')}`);
  }
  
  const { lastUserMessageIsChinese, getPlaceholder } = useLanguageDetection(messages, input);
  
  return (
    <Card className="finance-card h-full flex flex-col">
      <ChatHeader 
        isGrokApiKeySet={isGrokApiKeySet} 
        onOpenApiKeyDialog={onOpenApiKeyDialog} 
      />
      
      <ChatContent
        messages={messages}
        isLoading={isLoading}
        onRetry={retryLastQuery}
        translatingMessageIds={translatingMessageIds}
      />
      
      <ChatInput 
        input={input}
        setInput={setInput}
        handleSend={handleSend}
        isLoading={isLoading}
        isGrokApiKeySet={isGrokApiKeySet}
        onOpenApiKeyDialog={onOpenApiKeyDialog}
        handleKeyDown={handleKeyDown}
        placeholder={getPlaceholder()}
      />
    </Card>
  );
};

export default ChatContainer;
