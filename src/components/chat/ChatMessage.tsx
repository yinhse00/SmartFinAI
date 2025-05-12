
import React, { useState, useEffect } from 'react';
import { RefreshCw } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import TypingAnimation from './TypingAnimation';
import { Message } from './ChatMessage';

interface ChatMessageProps {
  message: Message;
  onRetry?: () => void;
  onTypingProgress?: () => void;
  isTranslating?: boolean;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({
  message,
  onRetry,
  onTypingProgress,
  isTranslating = false
}) => {
  const {
    sender,
    content,
    references,
    isError,
    isUsingFallback,
    reasoning,
    queryType,
    isTruncated,
    isBatchPart,
    originalContent,
    translationInProgress,
    id
  } = message;
  
  const [isTypingComplete, setIsTypingComplete] = useState(sender === 'user');
  const [showOriginal, setShowOriginal] = useState(false);

  // Debug output for empty content detection
  useEffect(() => {
    if (sender === 'bot' && (!content || content.trim() === '')) {
      console.error(`Empty message content detected for bot message ID: ${id}`, message);
    }
  }, [id, sender, content, message]);

  // Ensure displayContent always has a value
  const safeContent = content || "";
  const displayContent = showOriginal && originalContent ? originalContent : safeContent;

  // Handle empty content in bot messages that aren't currently being processed
  if ((!content || content.trim() === '') && sender === 'bot' && !isTranslating && !translationInProgress && isError) {
    return (
      <div className="flex justify-start mb-4 w-full">
        <Card className="p-3 rounded-lg bg-red-50 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300 w-full">
          <div className="whitespace-pre-line">
            Message content is empty. There might be an issue with the response generation.
            {onRetry && (
              <div className="mt-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={onRetry} 
                  className="bg-red-100 text-red-800 border-red-200 hover:bg-red-200 dark:bg-red-900/50 dark:text-red-300 dark:border-red-700"
                >
                  <RefreshCw size={12} className="mr-1" />
                  Retry query
                </Button>
              </div>
            )}
          </div>
        </Card>
      </div>
    );
  }
  
  return (
    <div className={`flex ${sender === 'user' ? 'justify-end' : 'justify-start'} mb-4 w-full`}>
      <div className={`flex items-start gap-3 w-full ${sender === 'user' ? 'flex-row-reverse' : ''}`}>
        <Card className={`p-3 rounded-lg w-full ${
          sender === 'user' 
            ? 'bg-finance-medium-blue text-white' 
            : isError 
              ? 'bg-red-50 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300' 
              : translationInProgress 
                ? 'bg-gray-50 dark:bg-gray-800 opacity-70' 
                : 'bg-gray-50 dark:bg-gray-800'
        }`}>
          {/* Bot message content */}
          {sender === 'bot' && !isTypingComplete && !isTranslating && !translationInProgress && (
            <TypingAnimation 
              text={displayContent} 
              className="whitespace-pre-line text-left" 
              onComplete={() => setIsTypingComplete(true)} 
              onProgress={onTypingProgress} 
            />
          )}
          
          {/* User message content or bot message when translation is in progress */}
          {(sender === 'user' || isTranslating || translationInProgress || (sender === 'bot' && isTypingComplete)) && (
            <div className={`whitespace-pre-line ${sender === 'user' ? 'text-right' : 'text-left'}`}>
              {translationInProgress && sender === 'bot' ? (
                <div className="flex flex-col gap-2">
                  <div className="text-sm text-gray-500 dark:text-gray-400">正在翻译中...</div>
                  <div className="opacity-60">{displayContent}</div>
                </div>
              ) : (
                displayContent
              )}
            </div>
          )}
          
          {/* Toggle original/translated content option for bot messages */}
          {sender === 'bot' && originalContent && isTypingComplete && !isTranslating && !translationInProgress && (
            <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setShowOriginal(!showOriginal)} 
                className="text-xs text-finance-medium-blue dark:text-finance-light-blue"
              >
                {showOriginal ? "查看翻译" : "View original (English)"}
              </Button>
            </div>
          )}
          
          {/* Truncated message retry button */}
          {isTruncated && sender === 'bot' && onRetry && isTypingComplete && !isTranslating && !translationInProgress && (
            <div className="mt-3 pt-2 border-t border-gray-200 dark:border-gray-700">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={onRetry} 
                className="flex items-center text-xs bg-finance-light-blue/20 hover:bg-finance-light-blue/40 text-finance-dark-blue hover:text-finance-dark-blue"
              >
                <RefreshCw size={12} className="mr-1" />
                Retry query
              </Button>
            </div>
          )}
          
          {/* References badges */}
          {references && references.length > 0 && isTypingComplete && !isTranslating && !translationInProgress && (
            <div className="mt-2 flex flex-wrap gap-1">
              {references.map((ref, i) => (
                <Badge 
                  key={i} 
                  variant="outline" 
                  className="text-xs bg-finance-light-blue/20 dark:bg-finance-medium-blue/20"
                >
                  {ref}
                </Badge>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default ChatMessage;

