
import React, { useRef, useEffect } from 'react';
import ChatMessage, { Message } from './ChatMessage';
import ChatLoadingIndicator from './ChatLoadingIndicator';
import { ScrollArea } from '@/components/ui/scroll-area';

interface ChatHistoryProps {
  messages: Message[];
  isLoading: boolean;
  onRetry?: () => void;
}

const ChatHistory: React.FC<ChatHistoryProps> = ({ messages, isLoading, onRetry }) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  return (
    <ScrollArea className="h-full pr-4 pb-6">
      <div className="py-4 space-y-4">
        {messages.map((message) => (
          <ChatMessage 
            key={message.id} 
            message={message} 
            onRetry={onRetry && message.sender === 'bot' ? onRetry : undefined} 
          />
        ))}
        {isLoading && <ChatLoadingIndicator />}
        <div ref={messagesEndRef} />
      </div>
    </ScrollArea>
  );
};

export default ChatHistory;
