import React, { useRef, useEffect } from 'react';
import { Message, ChatMessage } from './ChatMessage';

interface ChatHistoryProps {
  messages: Message[];
  isLoading: boolean;
  onRetry?: () => void;
  translatingMessageIds?: string[];
}

const ChatHistory: React.FC<ChatHistoryProps> = ({ messages, isLoading, onRetry, translatingMessageIds = [] }) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom on new messages or when messages are updated
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isLoading]);
  
  // Additional scrolling effect for when message content changes
  // This helps keep the view at the bottom during typing animation
  const handleTypingProgress = () => {
    if (messagesEndRef.current) {
      // Use a more targeted approach to only scroll when needed
      const container = messagesEndRef.current.parentElement;
      if (container) {
        const isAtBottom = container.scrollHeight - container.scrollTop <= container.clientHeight + 150;
        
        // Only auto-scroll if user is already near the bottom
        if (isAtBottom) {
          messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
      }
    }
  };

  useEffect(() => {
    console.log('ChatHistory rendering with messages:', messages.length);
    
    // Log message content for debugging
    const validMessages = messages.filter(m => m.content || m.sender === 'user');
    
    if (validMessages.length < messages.length) {
      console.log('Found', messages.length - validMessages.length, 'messages with empty content');
    }
    
    if (validMessages.length > 0) {
      console.log('First few messages:', validMessages.slice(0, 3).map(m => 
        `${m.sender}: ${m.content ? m.content.substring(0, 30) + '...' : '[EMPTY]'}`
      ));
    }
  }, [messages]);

  // Check if any messages are truncated
  const hasTruncatedMessages = messages.some(message => message.isTruncated);
  
  // Check if we're displaying Chinese content
  const lastUserMessage = [...messages].reverse().find(m => m.sender === 'user');
  const lastUserMessageIsChinese = lastUserMessage?.content && /[\u4e00-\u9fa5]/.test(lastUserMessage.content);
  
  // Group consecutive batch parts for better rendering
  const groupedMessages = messages.reduce((acc: Message[][], message, index) => {
    const prevMessage = index > 0 ? messages[index - 1] : null;
    
    // Start a new group if:
    // 1. This is the first message
    // 2. Current message is from a different sender than previous
    // 3. Current message is not a batch part
    // 4. Previous message is not a batch part
    if (
      index === 0 || 
      message.sender !== prevMessage?.sender || 
      !message.isBatchPart || 
      !prevMessage?.isBatchPart
    ) {
      acc.push([message]);
    } else {
      // Add to the current group if it's a continuation
      acc[acc.length - 1].push(message);
    }
    
    return acc;
  }, []);
  
  return (
    <div className="h-full py-4 space-y-4 px-4 md:px-6 lg:px-8 w-full">
      {hasTruncatedMessages && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-md p-3 mb-4 flex justify-between items-center animate-fade-in">
          <div className="text-sm text-amber-800 dark:text-amber-300">
            {lastUserMessageIsChinese 
              ? "部分回复似乎不完整。您可以重试您的查询以获取完整答案。"
              : "Some responses appear to be incomplete. You can retry your queries to get complete answers."}
          </div>
          {onRetry && (
            <button
              onClick={onRetry}
              className="text-xs bg-amber-100 hover:bg-amber-200 dark:bg-amber-800/40 dark:hover:bg-amber-800/60 text-amber-800 dark:text-amber-300 px-3 py-1 rounded"
            >
              {lastUserMessageIsChinese ? "重试上一个查询" : "Retry Last Query"}
            </button>
          )}
        </div>
      )}
      
      {messages.length > 0 ? (
        messages.map((message) => (
          <ChatMessage 
            key={message.id} 
            message={message} 
            onRetry={onRetry && message.sender === 'bot' ? onRetry : undefined}
            onTypingProgress={handleTypingProgress}
            isTranslating={translatingMessageIds.includes(message.id)}
          />
        ))
      ) : (
        <div className="flex justify-center items-center h-full">
          <p className="text-gray-500">No messages yet. Start a conversation!</p>
        </div>
      )}
      
      {isLoading && (
        <div className="flex justify-center">
          <div className="h-8 w-8 rounded-full border-2 border-finance-medium-blue border-t-transparent animate-spin"></div>
        </div>
      )}
      
      {translatingMessageIds.length > 0 && !isLoading && (
        <div className="flex justify-center">
          <div className="text-xs text-finance-medium-blue dark:text-finance-light-blue flex items-center gap-1 bg-finance-light-blue/10 dark:bg-finance-medium-blue/10 px-2 py-1 rounded-full">
            <div className="w-2 h-2 bg-finance-accent-blue rounded-full animate-pulse"></div>
            {lastUserMessageIsChinese ? "正在翻译..." : "Translating..."}
          </div>
        </div>
      )}
      
      <div ref={messagesEndRef} />
    </div>
  );
};

export default ChatHistory;
