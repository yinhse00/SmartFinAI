import React, { useEffect, useRef, useState } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { AlertCircle, Wifi, WifiOff } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ChatMessage, Message } from '../ChatMessage';
import ChatLoadingIndicator from '../ChatLoadingIndicator';
import WorkflowIndicator from '../workflow/WorkflowIndicator';
import { WorkflowPhase } from '../workflow/workflowConfig';

interface ChatContentProps {
  messages: Message[];
  isLoading: boolean;
  onRetry?: () => void;
  translatingMessageIds?: string[];
  isOfflineMode?: boolean;
  onTryReconnect?: () => Promise<boolean>;
  currentStep?: WorkflowPhase;
  stepProgress?: string;
}

const ChatContent: React.FC<ChatContentProps> = ({
  messages,
  isLoading,
  onRetry,
  translatingMessageIds = [],
  isOfflineMode = false,
  onTryReconnect,
  currentStep = WorkflowPhase.ANALYSIS,
  stepProgress = ''
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isScrolledToBottom, setIsScrolledToBottom] = useState(true);

  // Function to scroll to the bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    setIsScrolledToBottom(true);
  };

  // Effect to scroll to bottom on new messages
  useEffect(() => {
    if (isLoading || isScrolledToBottom) {
      scrollToBottom();
    }
  }, [messages, isLoading, isScrolledToBottom]);

  // Handle scroll events to detect if user has scrolled up
  const handleScroll = (event: React.SyntheticEvent<HTMLDivElement>) => {
    const element = event.currentTarget;
    const atBottom = element.scrollHeight - element.scrollTop === element.clientHeight;
    setIsScrolledToBottom(atBottom);
  };

  // Reconnection handling
  const handleReconnect = async () => {
    if (onTryReconnect) {
      const success = await onTryReconnect();
      if (success) {
        console.log('Reconnected successfully');
      } else {
        console.error('Failed to reconnect');
      }
    }
  };
  
  return (
    <ScrollArea className="flex-1 p-4" onScroll={handleScroll}>
      <div className="space-y-4 pb-4">
        {/* Offline mode indicator */}
        {isOfflineMode && (
          <div className="flex items-center justify-center p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
            <WifiOff className="h-4 w-4 text-amber-600 mr-2" />
            <span className="text-sm text-amber-700 dark:text-amber-300 mr-3">
              Offline Mode - Using local responses
            </span>
            {onTryReconnect && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleReconnect}
                className="text-xs h-7 px-2"
              >
                <Wifi className="h-3 w-3 mr-1" />
                Reconnect
              </Button>
            )}
          </div>
        )}

        {/* Messages */}
        {messages.map((message) => (
          <ChatMessage
            key={message.id}
            message={message}
            onRetry={message.isError ? onRetry : undefined}
            isTranslating={translatingMessageIds.includes(message.id)}
          />
        ))}

        {/* Loading indicator with workflow */}
        {isLoading && (
          <div className="space-y-3">
            <WorkflowIndicator 
              currentStep={currentStep}
              stepProgress={stepProgress}
            />
            <ChatLoadingIndicator />
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>
    </ScrollArea>
  );
};

export default ChatContent;
