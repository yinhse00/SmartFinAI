
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
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const autoScrollEnabledRef = useRef<boolean>(true);

  // Improved auto-scroll logic with user override detection
  const scrollToBottom = () => {
    if (messagesEndRef.current && autoScrollEnabledRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Handle user manual scrolling
  const handleUserScroll = (event: React.UIEvent<HTMLDivElement>) => {
    const element = event.currentTarget;
    const isScrolledToBottom = Math.abs(
      element.scrollHeight - element.scrollTop - element.clientHeight
    ) < 50;
    
    // Only change auto-scroll state when manually scrolled away from bottom
    autoScrollEnabledRef.current = isScrolledToBottom;
  };

  // Auto-scroll on messages change, loading state change, or typing progress
  useEffect(() => {
    // Use requestAnimationFrame to ensure DOM is fully updated before scrolling
    requestAnimationFrame(scrollToBottom);
    
    // Set up a periodic scroll check for typing animations
    const typingScrollInterval = setInterval(() => {
      if (autoScrollEnabledRef.current) {
        scrollToBottom();
      }
    }, 500);
    
    return () => {
      clearInterval(typingScrollInterval);
    };
  }, [messages, isLoading]);

  // Check if any messages are truncated
  const hasTruncatedMessages = messages.some(message => message.isTruncated);

  return (
    <div className="h-full overflow-hidden flex flex-col">
      <ScrollArea 
        className="h-full pb-6 flex-1" 
        ref={scrollAreaRef} 
        type="always"
        onScroll={handleUserScroll}
      >
        <div className="py-4 space-y-4 px-4">
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
                // When receiving responses, check if we should auto-scroll
                if (autoScrollEnabledRef.current) {
                  scrollToBottom();
                }
              }} 
            />
          ))}
          {isLoading && <ChatLoadingIndicator />}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>
    </div>
  );
};

export default ChatHistory;
