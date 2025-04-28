
import React, { useRef, useEffect } from 'react';
import ChatMessage, { Message } from './ChatMessage';
import ChatLoadingIndicator from './ChatLoadingIndicator';

interface ChatHistoryProps {
  messages: Message[];
  isLoading: boolean;
  onRetry?: () => void;
  translatingMessageIds?: string[];
}

const ChatHistory: React.FC<ChatHistoryProps> = ({ messages, isLoading, onRetry, translatingMessageIds = [] }) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isLoading]);

  // Check if any messages are truncated
  const hasTruncatedMessages = messages.some(message => message.isTruncated);

  return (
    <div className="h-full py-4 space-y-4 px-4">
      {hasTruncatedMessages && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-md p-3 mb-4 flex justify-between items-center">
          <div className="text-sm text-amber-800 dark:text-amber-300">
            Some responses appear to be incomplete. You can retry your queries to get complete answers.
          </div>
          {onRetry && (
            <button
              onClick={onRetry}
              className="text-xs bg-amber-100 hover:bg-amber-200 dark:bg-amber-800/40 dark:hover:bg-amber-800/60 text-amber-800 dark:text-amber-300 px-3 py-1 rounded"
            >
              Retry Last Query
            </button>
          )}
        </div>
      )}
      
      {messages.map((message) => (
        <ChatMessage 
          key={message.id} 
          message={message} 
          onRetry={onRetry && message.sender === 'bot' ? onRetry : undefined}
          onTypingProgress={() => {
            if (messagesEndRef.current) {
              messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
            }
          }}
          isTranslating={translatingMessageIds.includes(message.id)}
        />
      ))}
      
      {isLoading && <ChatLoadingIndicator />}
      <div ref={messagesEndRef} />
    </div>
  );
};

export default ChatHistory;
