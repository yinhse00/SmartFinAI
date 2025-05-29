
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
            className="regulatory-content"
          />
        )}
        
        {/* Enhanced styling for regulatory reference links */}
        <style jsx>{`
          .regulatory-content :global(a) {
            color: inherit;
            text-decoration: underline;
            text-decoration-style: dotted;
            text-underline-offset: 2px;
            transition: all 0.2s ease;
          }
          
          .regulatory-content :global(a:hover) {
            text-decoration-style: solid;
            text-decoration-color: var(--finance-accent-green);
          }
          
          .regulatory-content :global(a:visited) {
            color: inherit;
          }
          
          .regulatory-content :global(a:focus) {
            outline: 2px solid var(--finance-accent-blue);
            outline-offset: 2px;
            border-radius: 2px;
          }
        `}</style>
      </div>
    );
  }
  
  return null;
};
