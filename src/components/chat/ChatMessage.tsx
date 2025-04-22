
import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import TypingAnimation from './TypingAnimation';
import MessageStyle from './message/MessageStyle';
import MessageContentFormatter from './message/MessageContentFormatter';
import MessageActions from './message/MessageActions';
import MessageReferences from './message/MessageReferences';

export interface Message {
  id: string;
  content: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  references?: string[];
  isError?: boolean;
  isUsingFallback?: boolean;
  reasoning?: string;
  queryType?: string;
  isTruncated?: boolean;
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
    isTruncated 
  } = message;
  
  const [isTypingComplete, setIsTypingComplete] = useState(sender === 'user');
  
  const getMessageClass = () => {
    if (sender === 'user') {
      return 'bg-finance-medium-blue text-white';
    }
    if (isError) {
      return 'bg-red-50 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300';
    }
    return 'bg-slate-50 dark:bg-gray-800 border border-slate-100 dark:border-gray-700';
  };
  
  return (
    <div className={`flex ${sender === 'user' ? 'justify-end' : 'justify-start'} mb-4`}>
      <div className={`flex items-start gap-3 max-w-[88%] ${sender === 'user' ? 'flex-row-reverse' : ''}`}>
        <Card className={`p-4 rounded-lg ${getMessageClass()}`}>
          {sender === 'user' ? (
            <div className="whitespace-pre-line text-base leading-relaxed">
              {content}
            </div>
          ) : (
            <div>
              <TypingAnimation 
                text={content} 
                className="whitespace-pre-line"
                onComplete={() => setIsTypingComplete(true)}
                onProgress={onTypingProgress}
              />
              
              {isTypingComplete && (
                <MessageContentFormatter 
                  content={content}
                  isTypingComplete={isTypingComplete}
                />
              )}
              
              <MessageStyle isTypingComplete={isTypingComplete} />
              
              <MessageActions 
                isTruncated={isTruncated || false}
                sender={sender}
                isTypingComplete={isTypingComplete}
                onRetry={onRetry}
              />
              
              <MessageReferences 
                references={references}
                isTypingComplete={isTypingComplete}
              />
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default ChatMessage;
