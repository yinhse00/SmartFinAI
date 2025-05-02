
import React, { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw, Check, Loader2 } from 'lucide-react';
import { formatMessageText } from '@/utils/textFormatters';

export interface Message {
  id: string;
  content: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  isError?: boolean;
  isTruncated?: boolean;
  isBatchPart?: boolean;
  metadata?: {
    regulatoryContext?: {
      sources?: string[];
      relevanceScore?: number;
      citations?: {
        text: string;
        reference: string;
        source: string;
      }[];
      knowledgeGraphLinks?: {
        from: string;
        to: string;
        relationship: string;
      }[];
    };
    isBackupResponse?: boolean;
    mayRequireBatching?: boolean;
    batchSuggestion?: string;
    [key: string]: any;
  };
}

interface ChatMessageProps {
  message: Message;
  onRetry?: () => void;
  isTranslating?: boolean;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message, onRetry, isTranslating }) => {
  const [showRegulatoryDetails, setShowRegulatoryDetails] = useState(false);
  const { content, sender, isError } = message;
  
  const hasCitations = 
    message.metadata?.regulatoryContext?.citations && 
    message.metadata.regulatoryContext.citations.length > 0;
    
  const hasKnowledgeGraph = 
    message.metadata?.regulatoryContext?.knowledgeGraphLinks && 
    message.metadata.regulatoryContext.knowledgeGraphLinks.length > 0;

  return (
    <div className={`flex items-start gap-3 mb-4 ${sender === 'user' ? 'flex-row-reverse' : ''}`}>
      <Avatar className={`mt-1 ${sender === 'user' ? 'bg-green-100' : 'bg-blue-100'}`}>
        <AvatarFallback>{sender === 'user' ? 'U' : 'B'}</AvatarFallback>
        <AvatarImage src={sender === 'user' ? '/avatars/user.png' : '/avatars/bot.png'} />
      </Avatar>
      
      <div className={`max-w-[80%] ${sender === 'user' ? 'text-right' : 'text-left'}`}>
        <Card className={`
          inline-block 
          ${sender === 'user' 
            ? 'bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800' 
            : 'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800'
          }
          ${isError ? 'border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-950/30' : ''}
        `}>
          <CardContent className={`p-3 ${isError ? 'text-red-600 dark:text-red-400' : ''}`}>
            {formatMessageText(content)}
            
            {/* Regulatory citations section */}
            {hasCitations && showRegulatoryDetails && (
              <div className="mt-3 border-t border-blue-200 dark:border-blue-800 pt-2">
                <h4 className="text-sm font-medium mb-1">Citations</h4>
                <div className="text-xs space-y-1">
                  {message.metadata?.regulatoryContext?.citations?.map((citation, idx) => (
                    <div key={idx} className="border-l-2 border-blue-300 pl-2">
                      "{citation.text}" - <strong>{citation.reference}</strong> ({citation.source})
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Message footer with actions */}
        <div className={`flex mt-1 text-xs text-gray-500 ${sender === 'user' ? 'justify-end' : 'justify-start'}`}>
          {sender === 'bot' && (
            <>
              <span>
                {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
              
              {/* Show regulatory details toggle */}
              {(hasCitations || hasKnowledgeGraph) && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-5 text-xs ml-2 px-1"
                  onClick={() => setShowRegulatoryDetails(!showRegulatoryDetails)}
                >
                  {showRegulatoryDetails ? 'Hide sources' : 'Show sources'}
                </Button>
              )}
              
              {/* Retry button */}
              {onRetry && (message.isError || message.isTruncated) && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-5 text-xs ml-2 px-1"
                  onClick={onRetry}
                >
                  <RefreshCw className="h-3 w-3 mr-1" /> Retry
                </Button>
              )}
              
              {/* Translate status */}
              {isTranslating && (
                <div className="ml-2 flex items-center">
                  <Loader2 className="h-3 w-3 mr-1 animate-spin" /> 
                  <span className="text-xs">Translating</span>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatMessage;
