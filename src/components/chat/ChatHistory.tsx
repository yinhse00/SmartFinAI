
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

  // Scroll to bottom function
  const scrollToBottom = () => {
    if (messagesEndRef.current && autoScroll && !userScrolling) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Improved scroll detection
  const handleUserScroll = (event: React.UIEvent<HTMLDivElement>) => {
    const element = event.currentTarget;
    const currentScrollTop = element.scrollTop;
    
    // Detect scroll movement with very low threshold
    const isUserScrolling = Math.abs(currentScrollTop - lastScrollPosition.current) > 1;
    
    if (isUserScrolling) {
      setUserScrolling(true);
      
      // Clear any existing timeout
      clearTimeout((window as any).scrollTimeout);
      
      // Set a longer timeout to allow users to read without auto-scrolling interruption
      (window as any).scrollTimeout = setTimeout(() => {
        setUserScrolling(false);
      }, 8000); // 8 seconds without scrolling before auto-scroll resumes
    }
    
    // Check if user has scrolled to bottom (or very close)
    const isNearBottom = 
      element.scrollHeight - element.scrollTop - element.clientHeight < 30;
    
    // Only update auto-scroll if we detect we're at the bottom
    setAutoScroll(isNearBottom);
    
    // Update last position
    lastScrollPosition.current = currentScrollTop;
  };

  // Auto-scroll on new messages
  useEffect(() => {
    if (autoScroll && !userScrolling && messages.length > 0) {
      // Use requestAnimationFrame for smoother scrolling
      requestAnimationFrame(scrollToBottom);
    }
    
    // Also set up frequent scroll checks for typing animations
    const typingScrollInterval = setInterval(() => {
      if (autoScroll && !userScrolling) {
        scrollToBottom();
      }
    }, 200);
    
    return () => {
      clearInterval(typingScrollInterval);
    };
  }, [messages, isLoading, autoScroll, userScrolling]);

  // Check if any messages are truncated
  const hasTruncatedMessages = messages.some(message => message.isTruncated);

  return (
    <div className="h-full flex flex-col">
      <ScrollArea 
        className="h-full flex-1 overflow-auto" 
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
