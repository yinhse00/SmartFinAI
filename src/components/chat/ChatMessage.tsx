import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RefreshCw } from 'lucide-react';
import TypingAnimation from './TypingAnimation';
import ValidationStatusIndicator from './ValidationStatusIndicator';
import detectAndFormatTables from '@/utils/tableFormatter';

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
  const [showOriginal, setShowOriginal] = useState(false);
  const [formattedContent, setFormattedContent] = useState('');
  
  // Determine initial characters to display immediately for the typing effect
  const getInitialVisibleChars = () => {
    if (isUserMessage) return 0;
    
    // For batch parts, show more initial content for better UX
    if (message.isBatchPart) return 120;
    
    // For regular messages, show the first sentence or first 60 chars
    const firstSentenceMatch = content?.match(/^([^.!?]+[.!?])\s/);
    if (firstSentenceMatch && firstSentenceMatch[1].length < 100) {
      return firstSentenceMatch[1].length;
    }
    return 60;
  };

  // Debug output for empty content detection
  useEffect(() => {
    if (isBot && (!content || content.trim() === '')) {
      console.error(`Empty message content detected for bot message ID: ${id}`, message);
    }
  }, [id, isBot, content, message]);

  // Process content when message changes or when toggling between original/translated
  useEffect(() => {
    // Ensure displayContent always has a value
    const safeContent = content || "";
    const displayContent = showOriginal && originalContent ? originalContent : safeContent;
    
    // Format tables and process content properly
    if (isBot) {
      const formatted = detectAndFormatTables(displayContent);
      setFormattedContent(formatted);
    } else {
      // For user messages, no formatting needed
      setFormattedContent(displayContent);
    }
  }, [content, originalContent, showOriginal, isBot]);

  // Handle typing progress callback properly
  const handleTypingProgress = () => {
    if (onTypingProgress) {
      onTypingProgress(0); // Pass a default value since TypingAnimation doesn't provide progress
    }
  };

  // Only show error for empty content if it's actually an error AND processing is complete
  if ((!content || content.trim() === '') && isBot && !isTranslating && !translationInProgress && isError) {
    return (
      <div className="flex justify-start mb-4 w-full">
        <Card className="p-3 rounded-lg bg-red-50 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300 w-full">
          <div className="whitespace-pre-line">
            Message content is empty. There might be an issue with the response generation.
            {onRetry && (
              <div className="mt-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={onRetry} 
                  className="bg-red-100 text-red-800 border-red-200 hover:bg-red-200 dark:bg-red-900/50 dark:text-red-300 dark:border-red-700"
                >
                  <RefreshCw size={12} className="mr-1" />
                  Retry query
                </Button>
              </div>
            )}
          </div>
        </Card>
      </div>
    );
  }
  
  return (
    <div className={`flex ${isUserMessage ? 'justify-end' : 'justify-start'} mb-4 w-full`}>
      <div className={`flex items-start gap-3 w-full ${isUserMessage ? 'flex-row-reverse' : ''}`}>
        <Card className={`p-3 rounded-lg w-full ${
          isUserMessage 
            ? 'bg-finance-medium-blue text-white' 
            : isError 
              ? 'bg-red-50 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300' 
              : translationInProgress 
                ? 'bg-gray-50 dark:bg-gray-800 opacity-70' 
                : 'bg-gray-50 dark:bg-gray-800'
        } ${message.isBatchPart ? 'animate-fade-in' : ''}`}>
          {/* Bot message content with enhanced typing animation */}
          {isBot && !isTypingComplete && !isTranslating && !translationInProgress && (
            <TypingAnimation 
              text={formattedContent} 
              className="whitespace-pre-line text-left chat-content" 
              onComplete={() => setIsTypingComplete(true)} 
              onProgress={handleTypingProgress}
              renderAsHTML={true}
              initialVisibleChars={getInitialVisibleChars()}
            />
          )}
          
          {/* User message content or bot message when translation is in progress or typing is complete */}
          {(isUserMessage || isTranslating || translationInProgress || (isBot && isTypingComplete)) && (
            <div className={`${isUserMessage ? 'text-right' : 'text-left'} ${isBot ? 'chat-content' : ''}`}>
              {translationInProgress && isBot ? (
                <div className="flex flex-col gap-2">
                  <div className="text-sm text-gray-500 dark:text-gray-400">正在翻译中...</div>
                  <div className="opacity-60" dangerouslySetInnerHTML={{ __html: formattedContent }} />
                </div>
              ) : isUserMessage ? (
                <div className="whitespace-pre-line">{formattedContent}</div>
              ) : (
                <div dangerouslySetInnerHTML={{ __html: formattedContent }} />
              )}
            </div>
          )}
          
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
                onClick={() => setShowOriginal(!showOriginal)} 
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
        </Card>
      </div>
    </div>
  );
};

export default ChatMessage;
