
import React, { useState, useEffect, useRef } from 'react';
import { Lightbulb, RefreshCw } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useTheme } from "next-themes";
import ChatTableMessage from './ChatTableMessage';

export interface Message {
  id: string;
  content: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  isError?: boolean;
  isTruncated?: boolean;
  references?: any[];
  isUsingFallback?: boolean;
  reasoning?: string;
  queryType?: string;
}

interface ChatMessageProps {
  message: Message;
  onRetry?: () => void;
  onTypingProgress?: () => void;
}

const ChatMessage = ({ message, onRetry, onTypingProgress }: ChatMessageProps) => {
  const [formattedDate, setFormattedDate] = useState<string>('');
  const [hasAnimated, setHasAnimated] = useState(false);
  const { theme } = useTheme();
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (message.sender === 'bot' && message.content && onTypingProgress && !hasAnimated) {
      let index = 0;
      const typingInterval = setInterval(() => {
        if (contentRef.current) {
          contentRef.current.innerHTML = message.content.substring(0, index);
          index++;
          onTypingProgress();
        }
        if (index > message.content.length) {
          clearInterval(typingInterval);
          if (contentRef.current) {
            contentRef.current.innerHTML = message.content;
          }
          setHasAnimated(true);
        }
      }, 4); // Changed from 20 to 4 to make it 5 times faster

      return () => clearInterval(typingInterval);
    }
  }, [message, onTypingProgress, hasAnimated]);

  useEffect(() => {
    setFormattedDate(formatDistanceToNow(message.timestamp, { addSuffix: true }));

    const intervalId = setInterval(() => {
      setFormattedDate(formatDistanceToNow(message.timestamp, { addSuffix: true }));
    }, 60000);

    return () => clearInterval(intervalId);
  }, [message.timestamp]);

  function renderContent() {
    if (!message.content) return null;

    const isTable = message.content.includes('|') && 
                   message.content.split('\n').filter(line => line.includes('|')).length >= 3;

    if (isTable) {
      return <ChatTableMessage content={message.content} />;
    }

    // More aggressive paragraph formatting for better readability
    const paragraphs = message.content.split('\n\n');
    
    return (
      <div className="prose dark:prose-invert break-words max-w-full">
        {paragraphs.map((paragraph, idx) => {
          // Skip empty paragraphs
          if (!paragraph.trim()) return null;
          
          // Handle code blocks
          if (paragraph.startsWith('```') && paragraph.endsWith('```')) {
            const codeContent = paragraph.substring(3, paragraph.length - 3);
            return (
              <pre key={idx} className="bg-gray-100 dark:bg-gray-800 p-3 rounded my-4 overflow-x-auto">
                <code>{codeContent}</code>
              </pre>
            );
          }
          
          // Format normal paragraphs
          const formattedPara = paragraph
            .replace(/`([^`]+)`/g, '<code class="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded">$1</code>')
            .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
            .replace(/\*([^*]+)\*/g, '<em>$1</em>')
            .replace(/\n/g, '<br />');
          
          return (
            <p 
              key={idx} 
              className="mb-5 mt-2" 
              dangerouslySetInnerHTML={{ __html: formattedPara }}
            />
          );
        })}
      </div>
    );
  }

  return (
    <div className="w-full px-4">
      <div className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
        <div className="w-full">
          <div className={`flex flex-col rounded-lg p-4 w-full ${
            message.sender === 'user'
              ? 'bg-finance-blue text-white ml-auto'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 mr-auto'
          }`}>
            {message.isError && (
              <div className="mb-2 p-2 rounded-md bg-red-200 dark:bg-red-800 text-red-800 dark:text-red-200">
                <Lightbulb className="inline-block mr-2 h-4 w-4 align-middle" />
                {message.content}
              </div>
            )}
            <div ref={contentRef} className="chat-message-content">
              {renderContent()}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-3">
              {formattedDate}
              {message.isTruncated && (
                <span className="ml-2">
                  <span className="inline-flex items-center font-semibold">
                    <Lightbulb className="mr-1 h-3 w-3" />
                    Incomplete Response
                  </span>
                  {onRetry && (
                    <button onClick={onRetry} className="ml-2 text-blue-500 hover:underline">
                      Retry
                      <RefreshCw className="inline-block ml-1 h-3 w-3" />
                    </button>
                  )}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatMessage;
