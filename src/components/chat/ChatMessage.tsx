
import React, { useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import TypingAnimation from './TypingAnimation';

export interface Message {
  id: string;
  sender: 'user' | 'bot';
  content: string;
  timestamp: Date;
  references?: string[];
  isUsingFallback?: boolean;
  reasoning?: string;
  isError?: boolean;
  queryType?: string;
  isTruncated?: boolean;
  isBatchPart?: boolean;
  isTranslated?: boolean;
  originalContent?: string;
}

interface ChatMessageProps {
  message: Message;
  onRetry?: () => void;
  onTypingProgress?: () => void;
  isTranslating?: boolean;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ 
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
    id
  } = message;
  
  const [isTypingComplete, setIsTypingComplete] = useState(sender === 'user');
  const [showOriginal, setShowOriginal] = useState(false);
  
  // Debug output
  if (isTranslating) {
    console.log(`Message ${id} is currently being translated`);
  }

  // Determine which content to display
  const displayContent = showOriginal && originalContent ? originalContent : content;
  
  return (
    <div className={`flex ${sender === 'user' ? 'justify-end' : 'justify-start'} mb-4`}>
      <div className={`${sender === 'user' ? 'flex items-start gap-3 max-w-[80%] flex-row-reverse' : 'w-full'}`}>
        <Card className={`p-3 rounded-lg ${
          sender === 'user' 
            ? 'bg-finance-medium-blue text-white max-w-[80%] ml-auto' 
            : isError 
              ? 'bg-red-50 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300 w-full' 
              : 'bg-gray-50 dark:bg-gray-800 w-full'
        }`}>
          {sender === 'user' || isTranslating ? (
            <div className="whitespace-pre-line">{displayContent}</div>
          ) : (
            <TypingAnimation 
              text={displayContent} 
              className="whitespace-pre-line"
              onComplete={() => setIsTypingComplete(true)}
              onProgress={onTypingProgress}
            />
          )}
          
          {/* Toggle original/translated content option for bot messages */}
          {sender === 'bot' && originalContent && isTypingComplete && !isTranslating && (
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
          {isTruncated && sender === 'bot' && onRetry && isTypingComplete && !isTranslating && (
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
          {references && references.length > 0 && isTypingComplete && !isTranslating && (
            <div className="mt-2 flex flex-wrap gap-1">
              {references.map((ref, i) => (
                <Badge key={i} variant="outline" className="text-xs bg-finance-light-blue/20 dark:bg-finance-medium-blue/20">
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
