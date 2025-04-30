
import React from 'react';

export interface Message {
  id: string;
  role: 'system' | 'user' | 'assistant';
  content: string;
  timestamp: number;
  metadata?: {
    isError?: boolean;
    errorType?: string;
    isTranslated?: boolean;
    originalLanguage?: string;
    truncated?: boolean;
    tokens?: number;
    contextTime?: number;
  };
}

export const ChatMessage: React.FC<{ message: Message }> = ({ message }) => {
  // This is a stub implementation since the actual component is read-only
  return (
    <div className="chat-message">
      {message.content}
    </div>
  );
};
