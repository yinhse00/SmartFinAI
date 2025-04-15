
import React from 'react';
import { Info, RefreshCw } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';

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
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message, onRetry }) => {
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
  
  return (
    <div className={`flex ${sender === 'user' ? 'justify-end' : 'justify-start'} mb-4`}>
      <div className={`flex items-start gap-3 max-w-[80%] ${sender === 'user' ? 'flex-row-reverse' : ''}`}>
        <Avatar className={sender === 'user' ? 'bg-finance-medium-blue' : 'bg-finance-light-blue'}>
          <AvatarFallback>{sender === 'user' ? 'U' : 'G'}</AvatarFallback>
          {sender === 'bot' && (
            <AvatarImage src="/grok-avatar.png" alt="Grok" />
          )}
        </Avatar>
        
        <div className={`space-y-2 ${sender === 'user' ? 'items-end' : 'items-start'}`}>
          <Card className={`p-3 rounded-lg ${
            sender === 'user' 
              ? 'bg-finance-medium-blue text-white' 
              : isError 
                ? 'bg-red-50 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300' 
                : 'bg-gray-50 dark:bg-gray-800'
          }`}>
            <div className="whitespace-pre-line">{content}</div>
            
            {isTruncated && sender === 'bot' && onRetry && (
              <div className="mt-3 pt-2 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-amber-600 dark:text-amber-400">This response may have been cut off</p>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={onRetry} 
                    className="flex items-center text-xs text-finance-medium-blue hover:text-finance-dark-blue dark:text-finance-accent-blue"
                  >
                    <RefreshCw size={12} className="mr-1" />
                    Retry query
                  </Button>
                </div>
              </div>
            )}
            
            {/* Display reasoning information if available */}
            {reasoning && (
              <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                <details className="text-sm">
                  <summary className="font-medium cursor-pointer flex items-center gap-1 text-finance-medium-blue dark:text-finance-accent-blue">
                    <Info size={14} />
                    View reasoning process
                  </summary>
                  <ScrollArea className="h-[150px] mt-2">
                    <div className="p-2 bg-gray-100 dark:bg-gray-900 rounded text-xs font-mono whitespace-pre-line">
                      {reasoning}
                    </div>
                  </ScrollArea>
                </details>
              </div>
            )}
          </Card>
          
          {references && references.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {references.map((ref, i) => (
                <Badge key={i} variant="outline" className="text-xs bg-finance-light-blue/20 dark:bg-finance-medium-blue/20">
                  {ref}
                </Badge>
              ))}
            </div>
          )}
          
          {isUsingFallback && (
            <div className="text-xs text-yellow-600 dark:text-yellow-400 flex items-center">
              <Info size={12} className="mr-1" />
              Using fallback response
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatMessage;
