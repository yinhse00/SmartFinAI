
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
}

interface ChatMessageProps {
  message: Message;
  onRetry?: () => void;
  onTypingProgress?: () => void;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message, onRetry, onTypingProgress }) => {
  const { 
    sender, 
    content, 
    references, 
    isError, 
    isUsingFallback, 
    reasoning,
    queryType,
    isTruncated,
    isBatchPart 
  } = message;
  
  const [isTypingComplete, setIsTypingComplete] = useState(sender === 'user');
  
  return (
    <div className={`flex ${sender === 'user' ? 'justify-end' : 'justify-start'} mb-4`}>
      <div className={`flex items-start gap-3 max-w-[80%] ${sender === 'user' ? 'flex-row-reverse' : ''}`}>
        <Card className={`p-3 rounded-lg ${
          sender === 'user' 
            ? 'bg-finance-medium-blue text-white' 
            : isError 
              ? 'bg-red-50 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300' 
              : 'bg-gray-50 dark:bg-gray-800'
        }`}>
          {sender === 'user' ? (
            <div className="whitespace-pre-line">{content}</div>
          ) : (
            <TypingAnimation 
              text={content} 
              className="whitespace-pre-line"
              onComplete={() => setIsTypingComplete(true)}
              onProgress={onTypingProgress}
            />
          )}
          
          {/* Truncated message retry button */}
          {isTruncated && sender === 'bot' && onRetry && isTypingComplete && (
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
          {references && references.length > 0 && isTypingComplete && (
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
