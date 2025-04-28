
import React from 'react';
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
  
  // Check if any Chinese text exists in input or messages
  const containsChinese = input.match(/[\u4e00-\u9fa5]/g) || 
    messages.some(m => m.content && m.content.match(/[\u4e00-\u9fa5]/g));
  
  // Get most recent user message language for UI labels
  const lastUserMessage = [...messages].reverse().find(m => m.sender === 'user');
  const lastUserMessageIsChinese = lastUserMessage?.content && /[\u4e00-\u9fa5]/.test(lastUserMessage.content);
  
  return (
    <Card className="finance-card h-full flex flex-col">
      <ChatHeader 
        isGrokApiKeySet={isGrokApiKeySet} 
        onOpenApiKeyDialog={onOpenApiKeyDialog} 
      />
      <CardContent 
        className="flex-1 p-0 overflow-auto max-h-[calc(100vh-25rem)] md:max-h-[calc(100vh-20rem)] min-h-[400px] flex flex-col"
      >
        <ChatHistory 
          messages={messages} 
          isLoading={isLoading} 
          onRetry={retryLastQuery}
          translatingMessageIds={translatingMessageIds}
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
        placeholder={lastUserMessageIsChinese ? "输入您的查询..." : "Type your query..."}
      />
    </Card>
  );
};

export default ChatContainer;
