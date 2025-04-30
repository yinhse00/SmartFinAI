
import React from 'react';
import { CardContent } from '@/components/ui/card';
import ChatHistory from '../ChatHistory';
import { Message } from '../ChatMessage';

interface ChatContentProps {
  messages: Message[];
  isLoading: boolean;
  onRetry?: () => void;
  translatingMessageIds?: string[];
}

const ChatContent: React.FC<ChatContentProps> = ({
  messages,
  isLoading,
  onRetry,
  translatingMessageIds = []
}) => {
  return (
    <CardContent 
      className="flex-1 p-0 overflow-auto max-h-[calc(100vh-25rem)] md:max-h-[calc(100vh-20rem)] min-h-[400px] flex flex-col"
    >
      <ChatHistory 
        messages={messages} 
        isLoading={isLoading} 
        onRetry={onRetry}
        translatingMessageIds={translatingMessageIds}
      />
    </CardContent>
  );
};

export default ChatContent;
