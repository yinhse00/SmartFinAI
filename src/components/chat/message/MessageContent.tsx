
import React from 'react';
import detectAndFormatTables from '@/utils/tableFormatter';
import TypingAnimation from '../TypingAnimation';

interface MessageContentProps {
  content: string;
  isUserMessage: boolean;
  isBot: boolean;
  isTypingComplete: boolean;
  isTranslating: boolean;
  translationInProgress: boolean;
  formattedContent: string;
  onTypingComplete: () => void;
  onTypingProgress: () => void;
  getInitialVisibleChars: () => number;
}

export const MessageContent: React.FC<MessageContentProps> = ({
  content,
  isUserMessage,
  isBot,
  isTypingComplete,
  isTranslating,
  translationInProgress,
  formattedContent,
  onTypingComplete,
  onTypingProgress,
  getInitialVisibleChars
}) => {
  // Bot message content with enhanced typing animation
  if (isBot && !isTypingComplete && !isTranslating && !translationInProgress) {
    return (
      <TypingAnimation 
        text={formattedContent} 
        className="whitespace-pre-line text-left chat-content" 
        onComplete={onTypingComplete} 
        onProgress={onTypingProgress}
        renderAsHTML={true}
        initialVisibleChars={getInitialVisibleChars()}
      />
    );
  }
  
  // User message content or bot message when translation is in progress or typing is complete
  if (isUserMessage || isTranslating || translationInProgress || (isBot && isTypingComplete)) {
    return (
      <div className={`${isUserMessage ? 'text-right' : 'text-left'} ${isBot ? 'chat-content' : ''}`}>
        {translationInProgress && isBot ? (
          <div className="flex flex-col gap-2">
            <div className="text-sm text-gray-500 dark:text-gray-400">正在翻译中...</div>
            <div className="opacity-60" dangerouslySetInnerHTML={{ __html: formattedContent }} />
          </div>
        ) : isUserMessage ? (
          <div className="whitespace-pre-line">{formattedContent}</div>
        ) : (
          <div 
            dangerouslySetInnerHTML={{ __html: formattedContent }}
            className="regulatory-content [&_a]:text-inherit [&_a]:underline [&_a]:decoration-dotted [&_a]:underline-offset-2 [&_a]:transition-all [&_a]:duration-200 [&_a:hover]:decoration-solid [&_a:hover]:decoration-finance-accent-green [&_a:visited]:text-inherit [&_a:focus]:outline-2 [&_a:focus]:outline-finance-accent-blue [&_a:focus]:outline-offset-2 [&_a:focus]:rounded-sm"
          />
        )}
      </div>
    );
  }
  
  return null;
};
