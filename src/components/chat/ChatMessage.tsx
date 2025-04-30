
import React from 'react';
import { Avatar } from '@/components/ui/avatar';

export interface Message {
  id: string;
  content: string;
  sender: 'user' | 'bot' | 'system';
  timestamp: Date;
  isError?: boolean;
  metadata?: any;
  originalLanguage?: string;
}

interface ChatMessageProps {
  message: Message;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  return (
    <div 
      className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'} mb-4`}
    >
      <div 
        className={`
          max-w-[80%] p-3 rounded-lg
          ${message.sender === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'}
          ${message.isError ? 'bg-destructive text-destructive-foreground' : ''}
        `}
      >
        <div className="mb-1 text-sm font-medium flex justify-between">
          <span>
            {message.sender === 'user' ? 'You' : 'Financial Expert'}
          </span>
          <span className="text-xs opacity-70">
            {message.timestamp.toLocaleTimeString()}
          </span>
        </div>
        <p className="whitespace-pre-wrap">{message.content}</p>
      </div>
    </div>
  );
};

export default ChatMessage;
