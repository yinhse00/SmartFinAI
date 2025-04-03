
import React from 'react';
import { cn } from '@/lib/utils';
import { User, Bot, AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export interface Message {
  id: string;
  content: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  references?: string[];
  isUsingFallback?: boolean;
}

interface ChatMessageProps {
  message: Message;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  return (
    <div
      className={cn(
        "flex",
        message.sender === "user" ? "justify-end" : "justify-start"
      )}
    >
      <div
        className={cn(
          "max-w-[80%] rounded-lg p-3",
          message.sender === "user"
            ? "bg-finance-medium-blue text-white"
            : "bg-gray-100 dark:bg-finance-dark-blue/50 text-finance-dark-blue dark:text-white"
        )}
      >
        <div className="flex items-center gap-2 mb-1">
          {message.sender === "user" ? (
            <User size={16} />
          ) : (
            <Bot size={16} />
          )}
          <span className="text-xs opacity-70">
            {message.timestamp.toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
          
          {message.isUsingFallback && (
            <Badge 
              variant="outline" 
              className="ml-auto text-xs bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300 flex items-center gap-1"
            >
              <AlertTriangle size={10} /> Simulated Response
            </Badge>
          )}
        </div>
        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
        {message.references && message.references.length > 0 && (
          <div className="mt-2 pt-2 border-t border-gray-200 dark:border-finance-medium-blue/30">
            <div className="text-xs opacity-70 mb-1">References:</div>
            <div className="flex flex-wrap gap-1">
              {message.references.map((ref, i) => (
                <Badge 
                  key={i} 
                  variant="outline" 
                  className="text-xs bg-finance-highlight/50 dark:bg-finance-medium-blue/20"
                >
                  {ref}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatMessage;
