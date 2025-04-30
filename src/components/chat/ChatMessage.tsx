
import React, { useState } from 'react';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Languages, RefreshCw } from 'lucide-react';

export interface Message {
  id: string;
  content: string;
  sender: 'user' | 'bot' | 'system';
  timestamp: Date;
  isError?: boolean;
  metadata?: any;
  originalLanguage?: string;
  
  // Missing properties that need to be added
  isTruncated?: boolean;
  queryType?: string;
  references?: string[];
  isUsingFallback?: boolean;
  reasoning?: string;
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
  const [showOriginal, setShowOriginal] = useState(false);

  const toggleLanguage = () => {
    setShowOriginal(!showOriginal);
  };

  // Determine which content to display
  const displayContent = (showOriginal && message.originalContent) 
    ? message.originalContent 
    : message.content;

  return (
    <div 
      className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'} mb-4`}
    >
      <div 
        className={`
          max-w-[80%] p-3 rounded-lg
          ${message.sender === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'}
          ${message.isError ? 'bg-destructive text-destructive-foreground' : ''}
        `}
      >
        <div className="mb-1 text-sm font-medium flex justify-between">
          <span>
            {message.sender === 'user' ? 'You' : 'Financial Expert'}
          </span>
          <span className="text-xs opacity-70">
            {message.timestamp.toLocaleTimeString()}
          </span>
        </div>
        <p className="whitespace-pre-wrap">{displayContent}</p>
        
        {/* Show translation toggle if translated content exists */}
        {message.isTranslated && message.originalContent && (
          <div className="mt-2 flex justify-end">
            <Button 
              variant="outline" 
              size="sm" 
              className="text-xs flex items-center gap-1" 
              onClick={toggleLanguage}
            >
              <Languages size={12} />
              {showOriginal ? "Show Translation" : "Show Original"}
            </Button>
          </div>
        )}

        {/* Show retry button if message is truncated */}
        {message.isTruncated && message.sender === 'bot' && onRetry && (
          <div className="mt-2 flex justify-end">
            <Button 
              variant="outline" 
              size="sm" 
              className="text-xs flex items-center gap-1" 
              onClick={onRetry}
            >
              <RefreshCw size={12} />
              Retry for complete answer
            </Button>
          </div>
        )}
        
        {/* Show translating indicator */}
        {isTranslating && (
          <div className="mt-2 text-xs text-finance-medium-blue flex items-center gap-1">
            <div className="w-2 h-2 bg-finance-accent-blue rounded-full animate-pulse"></div>
            Translating...
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatMessage;
