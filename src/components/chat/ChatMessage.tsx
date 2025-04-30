
import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { Bot, User } from 'lucide-react';
import StructuredResponse from './StructuredResponse';

export interface Message {
  id: string;
  content: string;
  sender: 'user' | 'bot';
  timestamp: Date | number;
  isTranslating?: boolean;
  originalContent?: string;
  metadata?: {
    structuredResponseData?: {
      rulesAnalysis?: string;
      documentsChecklist?: string;
      executionPlan?: string;
      executionTimetable?: string;
    },
    mayRequireBatching?: boolean;
  };
}

interface ChatMessageProps {
  message: Message;
  onRetry?: () => void;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ message, onRetry }) => {
  const isBot = message.sender === 'bot';
  const hasStructuredData = message.metadata?.structuredResponseData;
  
  // Format the message timestamp
  const formatTimestamp = (timestamp: Date | number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  return (
    <div className={cn(
      'flex gap-3 p-4 items-start',
      isBot ? 'bg-gray-50 dark:bg-gray-900' : 'bg-white dark:bg-gray-950'
    )}>
      {/* Avatar for the message sender */}
      <Avatar className="h-8 w-8 border">
        {isBot ? (
          <>
            <AvatarFallback className="bg-finance-light-blue text-white">AI</AvatarFallback>
            <AvatarImage src="/bot-avatar.png" alt="AI" />
          </>
        ) : (
          <>
            <AvatarFallback className="bg-gray-200 dark:bg-gray-800">
              <User className="h-4 w-4 text-gray-500" />
            </AvatarFallback>
          </>
        )}
      </Avatar>
      
      {/* Message content */}
      <div className="flex-1 space-y-2">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm">
            {isBot ? 'AI Assistant' : 'You'}
          </span>
          <span className="text-xs text-gray-500">
            {formatTimestamp(message.timestamp)}
          </span>
        </div>
        
        {/* Regular message content */}
        <div className="text-sm whitespace-pre-wrap">{message.content}</div>
        
        {/* Display structured response if available */}
        {hasStructuredData && (
          <StructuredResponse 
            rulesAnalysis={message.metadata?.structuredResponseData?.rulesAnalysis}
            documentsChecklist={message.metadata?.structuredResponseData?.documentsChecklist}
            executionPlan={message.metadata?.structuredResponseData?.executionPlan}
            executionTimetable={message.metadata?.structuredResponseData?.executionTimetable}
          />
        )}
        
        {/* If this is a translated message, show the original */}
        {message.originalContent && (
          <div className="mt-2 text-xs text-gray-500 italic border-t pt-2">
            Original: {message.originalContent}
          </div>
        )}
        
        {/* Retry button for bot messages if needed */}
        {isBot && onRetry && (
          <div className="flex justify-end mt-2">
            <button
              onClick={onRetry}
              className="text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 underline"
            >
              Regenerate response
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatMessage;
