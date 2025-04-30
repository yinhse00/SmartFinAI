
import React from 'react';

export interface Message {
  id: string;
  content: string;
  timestamp: number;
  role: 'system' | 'user' | 'assistant';
  sender?: 'user' | 'bot'; // Added for backward compatibility
  metadata?: {
    isError?: boolean;
    errorType?: string;
    isTranslated?: boolean;
    originalLanguage?: string;
    truncated?: boolean;
    tokens?: number;
    contextTime?: number;
  };
  isError?: boolean;
  isTranslated?: boolean;
  originalContent?: string;
  isTruncated?: boolean;
  isBatchPart?: boolean;
  references?: string[];
  isUsingFallback?: boolean;
  reasoning?: string;
  queryType?: string;
}

export const ChatMessage: React.FC<{ 
  message: Message;
  onRetry?: () => void;
  onTypingProgress?: () => void;
  isTranslating?: boolean;
}> = ({ message, onRetry, onTypingProgress, isTranslating }) => {
  // This is a stub implementation since the actual component is read-only
  return (
    <div className="chat-message">
      {message.content}
    </div>
  );
};

// Add default export for backward compatibility
export default ChatMessage;
