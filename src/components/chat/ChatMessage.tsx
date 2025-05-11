
import React, { useEffect, useState } from 'react';
import { Avatar } from '@/components/ui/avatar';
import { Bot, User, AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import TypingAnimation from './TypingAnimation';
import { detectAndFormatTables } from '@/utils/tableFormatter';

export interface Message {
  id: string;
  content: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  reasoning?: string;
  references?: string[];
  queryType?: string;
  isUsingFallback?: boolean;
  isTruncated?: boolean;
  isBatchPart?: boolean;
}

interface ChatMessageProps {
  message: Message;
  onRetry?: () => void;
  onTypingProgress?: () => void;
  isTranslating?: boolean;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ 
  message, 
  onRetry,
  onTypingProgress,
  isTranslating = false
}) => {
  const [typedContent, setTypedContent] = useState('');
  const [isFullyTyped, setIsFullyTyped] = useState(false);
  const [formattedContent, setFormattedContent] = useState('');
  
  // Format message content to handle tables, alignment markers, etc.
  useEffect(() => {
    if (message.content && message.sender === 'bot' && isFullyTyped) {
      const formatted = detectAndFormatTables(typedContent);
      setFormattedContent(formatted);
    }
  }, [typedContent, isFullyTyped, message.content, message.sender]);
  
  // Use typing animation for bot messages
  useEffect(() => {
    if (message.content && message.sender === 'bot') {
      setIsFullyTyped(false);
      setTypedContent('');
      
      // Don't show typing animation for very short messages
      if (message.content.length < 15) {
        setTypedContent(message.content);
        setIsFullyTyped(true);
        return;
      }
      
      let i = 0;
      const content = message.content;
      const speed = Math.max(10, Math.min(25, 25 - content.length / 100)); // Adaptive speed
      
      const typeNextChar = () => {
        if (i < content.length) {
          setTypedContent(prev => prev + content.charAt(i));
          i++;
          onTypingProgress?.();
          
          // Speed up for long content
          const adjustedSpeed = i > 300 ? speed / 2 : speed;
          
          // Use rAF for smoother animation
          setTimeout(typeNextChar, adjustedSpeed);
        } else {
          setIsFullyTyped(true);
        }
      };
      
      // Start typing
      typeNextChar();
      
      // Clean up if component unmounts during typing
      return () => {
        i = content.length;
      };
    }
  }, [message.content, message.sender, onTypingProgress]);
  
  return (
    <div 
      className={cn(
        "flex flex-col py-4 px-3", 
        message.sender === 'bot' ? "bg-white dark:bg-gray-800" : "bg-gray-100 dark:bg-gray-900/50"
      )}
    >
      <div className="flex items-start gap-3">
        <Avatar className={cn(
          "h-9 w-9 flex items-center justify-center",
          message.sender === 'bot' ? "bg-finance-medium-blue text-white" : "bg-gray-700"
        )}>
          {message.sender === 'bot' ? <Bot size={18} /> : <User size={18} />}
        </Avatar>
        
        <div className="flex-1 space-y-2 overflow-hidden">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-sm">
              {message.sender === 'bot' ? 'Assistant' : 'You'}
            </h3>
            
            {message.isUsingFallback && (
              <span className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 text-xs px-2 py-0.5 rounded-full">
                Fallback Mode
              </span>
            )}
            
            {message.isTruncated && !isTranslating && (
              <span className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 text-xs px-2 py-0.5 rounded-full flex items-center gap-1">
                <AlertTriangle size={10} />
                Incomplete
              </span>
            )}
          </div>
          
          <div className="leading-relaxed text-gray-800 dark:text-gray-200">
            {message.sender === 'user' ? (
              <p>{message.content}</p>
            ) : (
              <>
                {!isFullyTyped && (
                  <>
                    <div dangerouslySetInnerHTML={{ __html: formattedContent || typedContent || '...' }} />
                    <TypingAnimation text="" />
                  </>
                )}
                
                {isFullyTyped && (
                  <>
                    <div dangerouslySetInnerHTML={{ __html: formattedContent || typedContent }} />
                    
                    {message.references && message.references.length > 0 && (
                      <div className="mt-4 pt-2 border-t border-gray-200 dark:border-gray-700">
                        <p className="text-xs text-gray-500 font-semibold">Source References:</p>
                        <ul className="text-xs text-gray-500 mt-1 list-disc pl-4">
                          {message.references.map((ref, index) => (
                            <li key={index}>{ref}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {isTranslating && (
                      <div className="mt-2 text-xs text-finance-medium-blue dark:text-finance-accent-blue flex items-center gap-1 animate-pulse">
                        <div className="w-2 h-2 bg-finance-accent-blue rounded-full"></div>
                        Translating...
                      </div>
                    )}
                    
                    {message.isTruncated && onRetry && (
                      <div className="mt-3">
                        <Button 
                          onClick={onRetry}
                          variant="outline"
                          size="sm" 
                          className="flex items-center gap-1 text-xs bg-blue-50 hover:bg-blue-100 border-blue-100 text-blue-700 dark:bg-blue-900/20 dark:border-blue-800 dark:hover:bg-blue-900/40 dark:text-blue-300"
                        >
                          <RefreshCw size={12} />
                          Retry with Different Approach
                        </Button>
                      </div>
                    )}
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Add a default export
export default ChatMessage;
