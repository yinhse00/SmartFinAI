
import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { MessageContent } from './message/MessageContent';
import { MessageActions } from './message/MessageActions';
import { MessageError } from './message/MessageError';
import { ImplementButton } from './message/ImplementButton';
import { useMessageFormatting } from './hooks/useMessageFormatting';
import { getInitialVisibleChars, getCardClassName } from './utils/messageUtils';
import { Message } from './ChatMessage';

interface ChatMessageProps {
  message: Message;
  onRetry?: () => void;
  onTypingProgress?: (progress: number) => void;
  isTranslating?: boolean;
  currentContent?: string;
  onImplementSuggestion?: (content: string) => void;
  isImplementing?: boolean;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({
  message,
  onRetry,
  onTypingProgress,
  isTranslating = false,
  currentContent = '',
  onImplementSuggestion,
  isImplementing = false
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

          {/* Implement Button for AI suggestions */}
          {isBot && onImplementSuggestion && (
            <ImplementButton
              message={message}
              currentContent={currentContent}
              onImplement={onImplementSuggestion}
              isImplementing={isImplementing}
            />
          )}
        </Card>
      </div>
    </div>
  );
};

export default ChatMessage;
