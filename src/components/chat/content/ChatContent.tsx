
import React from 'react';
import { CardContent } from '@/components/ui/card';
import ChatHistory from '../ChatHistory';
import { Message } from '../ChatMessage';
import { AlertCircle, WifiOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ProcessingIndicator from '../ProcessingIndicator';

interface ChatContentProps {
  messages: Message[];
  isLoading: boolean;
  onRetry?: () => void;
  translatingMessageIds?: string[];
  isOfflineMode?: boolean;
  onTryReconnect?: () => Promise<boolean>;
  currentStep?: 'preparing' | 'processing' | 'finalizing' | 'reviewing';
  stepProgress?: string;
}

const ChatContent: React.FC<ChatContentProps> = ({
  messages,
  isLoading,
  onRetry,
  translatingMessageIds = [],
  isOfflineMode = false,
  onTryReconnect,
  currentStep = 'preparing',
  stepProgress = ''
}) => {
  return (
    <CardContent className="flex-1 p-0 overflow-auto max-h-[calc(100vh-18rem)] md:max-h-[calc(100vh-15rem)] min-h-[500px] flex flex-col bg-gray-50 w-full">
      {isOfflineMode && (
        <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 m-4 p-3 rounded-md flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <WifiOff className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            <span className="text-sm font-medium text-amber-800 dark:text-amber-300">
              Operating in offline mode with limited functionality
            </span>
          </div>
          {onTryReconnect && (
            <Button 
              variant="outline" 
              size="sm" 
              className="w-fit border-amber-300 dark:border-amber-700 bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 hover:bg-amber-200 dark:hover:bg-amber-900/50" 
              onClick={onTryReconnect}
            >
              Try reconnect to API
            </Button>
          )}
        </div>
      )}

      <ChatHistory 
        messages={messages} 
        isLoading={isLoading} 
        onRetry={onRetry} 
        translatingMessageIds={translatingMessageIds} 
      />
      
      {/* Enhanced processing indicator inline */}
      {isLoading && (
        <div className="px-4 pb-4">
          <ProcessingIndicator 
            isVisible={isLoading} 
            stage={currentStep} 
            inline={true} 
          />
        </div>
      )}
    </CardContent>
  );
};

export default ChatContent;
