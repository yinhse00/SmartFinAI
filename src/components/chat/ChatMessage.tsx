
import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { MessageContent } from './message/MessageContent';
import { MessageActions } from './message/MessageActions';
import { MessageError } from './message/MessageError';
import { useMessageFormatting } from './hooks/useMessageFormatting';
import { getInitialVisibleChars, getCardClassName } from './utils/messageUtils';

export interface Message {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
  sender?: 'user' | 'bot' | 'system';
  references?: string[];
  isError?: boolean;
  isUsingFallback?: boolean;
  reasoning?: string;
  queryType?: string;
  isTruncated?: boolean;
  isBatchPart?: boolean;
  originalContent?: string;
  translationInProgress?: boolean;
  isTranslated?: boolean;
  metadata?: {
    financialQueryType?: string;
    reasoning?: string;
    processingTime?: number;
    model?: string;
    temperature?: number;
    maxTokens?: number;
    isTruncated?: boolean;
    isError?: boolean;
    translation?: string;
    guidanceMaterialsUsed?: boolean;
    sourceMaterials?: string[];
    validation?: {
      isValid: boolean;
      vettingConsistency: boolean;
      guidanceConsistency: boolean;
      validationNotes: string[];
      confidence: number;
    };
    vettingRequired?: boolean;
    vettingCategory?: string;
    relevantGuidance?: number;
    guidanceTypes?: string[];
  };
  verified?: boolean;
}

interface ChatMessageProps {
  message: Message;
  onRetry?: () => void;
  onTypingProgress?: (progress: number) => void;
  isTranslating?: boolean;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({
  message,
  onRetry,
  onTypingProgress,
  isTranslating = false
}) => {
  // Use consistent property names - prefer 'isUser' over 'sender'
  const isUserMessage = message.isUser ?? (message.sender === 'user');
  const isBot = !isUserMessage;
  const content = message.content || '';
  const references = message.references || [];
  const isError = message.isError || message.metadata?.isError;
  const isTruncated = message.isTruncated || message.metadata?.isTruncated;
  const translationInProgress = message.translationInProgress;
  const originalContent = message.originalContent;
  const id = message.id;
  
  const [isTypingComplete, setIsTypingComplete] = useState(isUserMessage);
  
  const { showOriginal, setShowOriginal, formattedContent } = useMessageFormatting({
    content,
    originalContent,
    isBot
  });

  // Debug output for empty content detection
  useEffect(() => {
    if (isBot && (!content || content.trim() === '')) {
      console.error(`Empty message content detected for bot message ID: ${id}`, message);
    }
  }, [id, isBot, content, message]);

  // Handle typing progress callback properly
  const handleTypingProgress = () => {
    if (onTypingProgress) {
      onTypingProgress(0); // Pass a default value since TypingAnimation doesn't provide progress
    }
  };

  const handleGetInitialVisibleChars = () => 
    getInitialVisibleChars(message, content, isUserMessage);

  // Only show error for empty content if it's actually an error AND processing is complete
  if ((!content || content.trim() === '') && isBot && !isTranslating && !translationInProgress && isError) {
    return <MessageError onRetry={onRetry} />;
  }
  
  const cardClassName = getCardClassName(isUserMessage, isError, translationInProgress, message.isBatchPart || false);
  
  return (
    <div className={`flex ${isUserMessage ? 'justify-end' : 'justify-start'} mb-4 w-full`}>
      <div className={`flex items-start gap-3 w-full ${isUserMessage ? 'flex-row-reverse' : ''}`}>
        <Card className={cardClassName}>
          <MessageContent
            content={content}
            isUserMessage={isUserMessage}
            isBot={isBot}
            isTypingComplete={isTypingComplete}
            isTranslating={isTranslating}
            translationInProgress={translationInProgress}
            formattedContent={formattedContent}
            onTypingComplete={() => setIsTypingComplete(true)}
            onTypingProgress={handleTypingProgress}
            getInitialVisibleChars={handleGetInitialVisibleChars}
          />
          
          <MessageActions
            message={message}
            isBot={isBot}
            isTypingComplete={isTypingComplete}
            isTranslating={isTranslating}
            translationInProgress={translationInProgress}
            originalContent={originalContent}
            showOriginal={showOriginal}
            onShowOriginalToggle={() => setShowOriginal(!showOriginal)}
            onRetry={onRetry}
            references={references}
            isTruncated={isTruncated}
          />
        </Card>
      </div>
    </div>
  );
};

export default ChatMessage;
