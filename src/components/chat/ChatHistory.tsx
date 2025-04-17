
import React, { useRef, useEffect, useState } from 'react';
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
  const [autoScroll, setAutoScroll] = useState(true);
  const [userScrolling, setUserScrolling] = useState(false);
  const lastScrollPosition = useRef(0);

  // Improved auto-scroll logic with user override capability
  const scrollToBottom = () => {
    if (messagesEndRef.current && autoScroll && !userScrolling) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Handle user manual scrolling with improved detection
  const handleUserScroll = (event: React.UIEvent<HTMLDivElement>) => {
    const element = event.currentTarget;
    const currentScrollTop = element.scrollTop;
    
    // Detect if user is actively scrolling (by comparing with previous position)
    const isUserInitiatedScroll = Math.abs(currentScrollTop - lastScrollPosition.current) > 10;
    
    if (isUserInitiatedScroll) {
      setUserScrolling(true);
      
      // After 1.5 seconds of no scrolling, consider the user finished scrolling
      clearTimeout((window as any).scrollTimeout);
      (window as any).scrollTimeout = setTimeout(() => {
        setUserScrolling(false);
      }, 1500);
    }
    
    // Check if we're near the bottom
    const isScrolledNearBottom = Math.abs(
      element.scrollHeight - element.scrollTop - element.clientHeight
    ) < 50;
    
    // Update auto-scroll state
    setAutoScroll(isScrolledNearBottom);
    
    // Update last scroll position
    lastScrollPosition.current = currentScrollTop;
  };

  // Auto-scroll on messages change or loading state change
  useEffect(() => {
    // Use requestAnimationFrame to ensure DOM is fully updated before scrolling
    requestAnimationFrame(scrollToBottom);
    
    // Set up a more frequent scroll check for typing animations (100ms)
    const typingScrollInterval = setInterval(() => {
      if (autoScroll && !userScrolling) {
        scrollToBottom();
      }
    }, 100);
    
    return () => {
      clearInterval(typingScrollInterval);
    };
  }, [messages, isLoading, autoScroll, userScrolling]);

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
                if (autoScroll && !userScrolling) {
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
