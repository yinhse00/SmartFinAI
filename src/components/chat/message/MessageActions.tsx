
import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RefreshCw } from 'lucide-react';
import ValidationStatusIndicator from '../ValidationStatusIndicator';
import { Message } from '../ChatMessage';

interface MessageActionsProps {
  message: Message;
  isBot: boolean;
  isTypingComplete: boolean;
  isTranslating: boolean;
  translationInProgress: boolean;
  originalContent?: string;
  showOriginal: boolean;
  onShowOriginalToggle: () => void;
  onRetry?: () => void;
  references: string[];
  isTruncated: boolean;
}

export const MessageActions: React.FC<MessageActionsProps> = ({
  message,
  isBot,
  isTypingComplete,
  isTranslating,
  translationInProgress,
  originalContent,
  showOriginal,
  onShowOriginalToggle,
  onRetry,
  references,
  isTruncated
}) => {
  return (
    <>
      {/* Validation Status Indicator for bot messages */}
      {isBot && isTypingComplete && !isTranslating && !translationInProgress && message.metadata && (
        <ValidationStatusIndicator
          validation={message.metadata.validation}
          vettingRequired={message.metadata.vettingRequired}
          vettingCategory={message.metadata.vettingCategory}
          relevantGuidance={message.metadata.relevantGuidance}
          guidanceTypes={message.metadata.guidanceTypes}
        />
      )}
      
      {/* Toggle original/translated content option for bot messages */}
      {isBot && originalContent && isTypingComplete && !isTranslating && !translationInProgress && (
        <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onShowOriginalToggle} 
            className="text-xs text-finance-medium-blue dark:text-finance-light-blue"
          >
            {showOriginal ? "查看翻译" : "View original (English)"}
          </Button>
        </div>
      )}
      
      {/* Truncated message retry button */}
      {isTruncated && isBot && onRetry && isTypingComplete && !isTranslating && !translationInProgress && (
        <div className="mt-3 pt-2 border-t border-gray-200 dark:border-gray-700">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onRetry} 
            className="flex items-center text-xs bg-finance-light-blue/20 hover:bg-finance-light-blue/40 text-finance-dark-blue hover:text-finance-dark-blue"
          >
            <RefreshCw size={12} className="mr-1" />
            Continue
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
    </>
  );
};
