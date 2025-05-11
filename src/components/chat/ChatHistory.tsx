import React, { useRef, useEffect } from 'react';
import { Message, ChatMessage } from './ChatMessage';
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
  
  return (
    <div className="h-full py-4 space-y-4 px-4">
      {hasTruncatedMessages && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-md p-3 mb-4 flex justify-between items-center">
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
            onTypingProgress={() => {
              if (messagesEndRef.current) {
                messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
              }
            }}
            isTranslating={translatingMessageIds.includes(message.id)}
          />
        ))
      ) : (
        <div className="flex justify-center items-center h-full">
          <p className="text-gray-500">No messages yet. Start a conversation!</p>
        </div>
      )}
      
      {isLoading && <ChatLoadingIndicator />}
      
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
