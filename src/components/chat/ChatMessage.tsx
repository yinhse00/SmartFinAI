
import React, { useState } from 'react';
import { Info, RefreshCw } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import TypingAnimation from './TypingAnimation';

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
    isUsingFallback, 
    reasoning,
    queryType,
    isTruncated 
  } = message;
  
  const [isTypingComplete, setIsTypingComplete] = useState(sender === 'user');
  
  // Function to format content with better paragraphs and code blocks
  const formatContent = (text: string): string => {
    // Process code blocks first 
    let formatted = text.replace(/```(.+?)```/gs, (match, codeContent) => {
      const parts = match.split('\n');
      if (parts.length > 2) {
        const language = parts[0].replace('```', '').trim();
        // Return HTML for styled code blocks
        return `<div class="code-block"><div class="code-header">${language}</div><pre><code>${codeContent.replace(/```/g, '')}</code></pre></div>`;
      }
      return match;
    });
    
    // Process inline code
    formatted = formatted.replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>');
    
    // Process paragraphs with appropriate spacing
    formatted = formatted.split('\n\n').map(paragraph => 
      `<p class="paragraph">${paragraph.replace(/\n/g, '<br>')}</p>`
    ).join('');
    
    // Add Grok-like styling for bullets
    formatted = formatted.replace(/•/g, '<span class="bullet">•</span>');
    
    return formatted;
  };
  
  const getMessageClass = () => {
    if (sender === 'user') {
      return 'bg-finance-medium-blue text-white';
    }
    if (isError) {
      return 'bg-red-50 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300';
    }
    // Grok-like light background for bot messages
    return 'bg-slate-50 dark:bg-gray-800 border border-slate-100 dark:border-gray-700';
  };
  
  return (
    <div className={`flex ${sender === 'user' ? 'justify-end' : 'justify-start'} mb-4`}>
      <div className={`flex items-start gap-3 max-w-[88%] ${sender === 'user' ? 'flex-row-reverse' : ''}`}>
        <Card className={`p-4 rounded-lg ${getMessageClass()}`}>
          {sender === 'user' ? (
            <div className="whitespace-pre-line text-base leading-relaxed">{content}</div>
          ) : (
            <div>
              <TypingAnimation 
                text={content} 
                className="whitespace-pre-line"
                onComplete={() => setIsTypingComplete(true)}
                onProgress={onTypingProgress}
              />
              
              {/* Render formatted content when typing is complete */}
              {isTypingComplete && (
                <div 
                  className="grok-message text-base leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: formatContent(content) }}
                />
              )}
              
              <style jsx>{`
                .grok-message {
                  opacity: ${isTypingComplete ? 1 : 0};
                  height: ${isTypingComplete ? 'auto' : 0};
                  overflow: hidden;
                  transition: opacity 0.3s ease;
                }
                .grok-message .paragraph {
                  margin-bottom: 1rem;
                }
                .grok-message .code-block {
                  background-color: #f8f9fc;
                  border-radius: 6px;
                  margin: 1rem 0;
                  overflow: hidden;
                  border: 1px solid #e2e8f0;
                }
                .grok-message .code-block .code-header {
                  background-color: #edf2f7;
                  padding: 0.5rem 1rem;
                  font-family: monospace;
                  font-size: 0.875rem;
                  color: #4a5568;
                  border-bottom: 1px solid #e2e8f0;
                }
                .grok-message .code-block pre {
                  padding: 1rem;
                  overflow-x: auto;
                  margin: 0;
                }
                .grok-message .code-block code {
                  font-family: monospace;
                  font-size: 0.875rem;
                  color: #2d3748;
                  background: transparent;
                }
                .grok-message .inline-code {
                  background-color: #f1f5f9;
                  padding: 0.1rem 0.3rem;
                  border-radius: 3px;
                  font-family: monospace;
                  font-size: 0.9em;
                  color: #4a5568;
                }
                .grok-message .bullet {
                  color: #6366f1;
                  display: inline-block;
                  margin-right: 0.5rem;
                }
                
                @media (prefers-color-scheme: dark) {
                  .grok-message .code-block {
                    background-color: #1e293b;
                    border-color: #334155;
                  }
                  .grok-message .code-block .code-header {
                    background-color: #0f172a;
                    color: #cbd5e1;
                    border-color: #334155;
                  }
                  .grok-message .code-block code {
                    color: #e2e8f0;
                  }
                  .grok-message .inline-code {
                    background-color: #1e293b;
                    color: #e2e8f0;
                  }
                }
              `}</style>
            </div>
          )}
          
          {/* Truncated message retry button */}
          {isTruncated && sender === 'bot' && onRetry && isTypingComplete && (
            <div className="mt-3 pt-2 border-t border-gray-200 dark:border-gray-700">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={onRetry} 
                className="flex items-center text-xs bg-finance-light-blue/20 hover:bg-finance-light-blue/40 text-finance-dark-blue hover:text-finance-dark-blue"
              >
                <RefreshCw size={12} className="mr-1" />
                Retry query
              </Button>
            </div>
          )}
          
          {/* References badges */}
          {references && references.length > 0 && isTypingComplete && (
            <div className="mt-2 flex flex-wrap gap-1">
              {references.map((ref, i) => (
                <Badge key={i} variant="outline" className="text-xs bg-finance-light-blue/20 dark:bg-finance-medium-blue/20">
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
