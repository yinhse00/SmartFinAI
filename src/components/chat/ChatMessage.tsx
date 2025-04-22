import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
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
}

interface ChatMessageProps {
  message: Message;
  onRetry?: () => void;
  onTypingProgress?: () => void;
}

const ChatMessage = ({ message, onRetry, onTypingProgress }: ChatMessageProps) => {
  const [formattedDate, setFormattedDate] = useState<string>('');
  const { theme } = useTheme();
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (message.sender === 'bot' && message.content && onTypingProgress) {
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
        }
      }, 20); // Adjust the interval for typing speed

      return () => clearInterval(typingInterval);
    }
  }, [message, onTypingProgress]);

  useEffect(() => {
    setFormattedDate(formatDistanceToNow(message.timestamp, { addSuffix: true }));

    const intervalId = setInterval(() => {
      setFormattedDate(formatDistanceToNow(message.timestamp, { addSuffix: true }));
    }, 60000); // Update every minute

    return () => clearInterval(intervalId);
  }, [message.timestamp]);

  const renderContent = () => {
    if (!message.content) return null;

    // Check if the message contains a table format
    const isTable = message.content.includes('|') && 
                   message.content.split('\n').filter(line => line.includes('|')).length >= 3;

    if (isTable) {
      return <ChatTableMessage content={message.content} />;
    }

    return (
      <ReactMarkdown
        className="prose dark:prose-invert break-words"
        remarkPlugins={[remarkGfm]}
      >
        {message.content}
      </ReactMarkdown>
    );
  };

  return (
    <div className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
      <div className="w-full max-w-2xl">
        <div className={`flex flex-col rounded-lg p-3 w-fit max-w-full ${message.sender === 'user'
          ? 'bg-finance-blue text-white ml-auto'
          : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 mr-auto'
          }`}>
          {message.isError && (
            <div className="mb-2 p-2 rounded-md bg-red-200 dark:bg-red-800 text-red-800 dark:text-red-200">
              <Lightbulb className="inline-block mr-2 h-4 w-4 align-middle" />
              {message.content}
            </div>
          )}
          <div ref={contentRef}>
            {renderContent()}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">
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
  );
};

export default ChatMessage;
