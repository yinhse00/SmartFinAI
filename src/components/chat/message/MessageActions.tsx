
import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, ExternalLink } from 'lucide-react';
import ValidationStatusIndicator from '../ValidationStatusIndicator';
import { Message } from '../ChatMessage';
import { mapReference } from '@/services/regulatory/urlMappingService';
import { extractRuleReferences } from '@/utils/regulatoryReferenceFormatter';

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
  // Convert reference strings to clickable badges
  const getClickableReferences = (refs: string[]) => {
    return refs.map((ref, i) => {
      // Try to extract and map the reference
      const extractedRefs = extractRuleReferences(ref);
      if (extractedRefs.length > 0) {
        const extracted = extractedRefs[0];
        const mapping = mapReference(extracted.type, extracted.identifier, ref);
        
        if (mapping) {
          return (
            <Badge 
              key={i} 
              variant="outline" 
              className="text-xs bg-finance-light-blue/20 dark:bg-finance-medium-blue/20 cursor-pointer hover:bg-finance-light-blue/40 dark:hover:bg-finance-medium-blue/40 transition-colors group"
              onClick={() => window.open(mapping.url, '_blank', 'noopener,noreferrer')}
            >
              <span className="flex items-center gap-1">
                {ref}
                <ExternalLink size={10} className="opacity-60 group-hover:opacity-100" />
              </span>
            </Badge>
          );
        }
      }
      
      // Fallback to non-clickable badge
      return (
        <Badge 
          key={i} 
          variant="outline" 
          className="text-xs bg-finance-light-blue/20 dark:bg-finance-medium-blue/20"
        >
          {ref}
        </Badge>
      );
    });
  };

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
      
      {/* Enhanced clickable references badges */}
      {references && references.length > 0 && isTypingComplete && !isTranslating && !translationInProgress && (
        <div className="mt-2 flex flex-wrap gap-1">
          {getClickableReferences(references)}
        </div>
      )}
    </>
  );
};
