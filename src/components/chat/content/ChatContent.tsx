
import React from 'react';
import { CardContent } from '@/components/ui/card';
import ChatHistory from '../ChatHistory';
import { Message } from '../ChatMessage';
import WorkflowIndicator from '../workflow/WorkflowIndicator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { WifiOff } from 'lucide-react';

interface ChatContentProps {
  messages: Message[];
  isLoading: boolean;
  onRetry?: () => void;
  translatingMessageIds?: string[];
  isOfflineMode?: boolean;
  currentStep?: 'initial' | 'listingRules' | 'takeoversCode' | 'execution' | 'response' | 'complete';
  stepProgress?: string;
}

const ChatContent: React.FC<ChatContentProps> = ({
  messages,
  isLoading,
  onRetry,
  translatingMessageIds = [],
  isOfflineMode = false,
  currentStep,
  stepProgress
}) => {
  return (
    <CardContent className="flex-1 p-0 overflow-auto max-h-[calc(100vh-20rem)] md:max-h-[calc(100vh-15rem)] min-h-[450px] flex flex-col w-full px-0 mx-0 my-0">
      <div className="sticky top-0 z-10 bg-background">
        {currentStep && stepProgress && <WorkflowIndicator currentStep={currentStep} stepProgress={stepProgress} />}
        
        {isOfflineMode && messages.length === 0 && (
          <Alert variant="warning" className="mx-4 mt-4 bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800">
            <WifiOff className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            <AlertDescription className="text-amber-700 dark:text-amber-300 text-sm">
              Currently operating in offline mode with limited functionality. 
              Some features like regulatory database access are unavailable.
            </AlertDescription>
          </Alert>
        )}
      </div>
      
      <ChatHistory 
        messages={messages} 
        isLoading={isLoading} 
        onRetry={onRetry} 
        translatingMessageIds={translatingMessageIds} 
      />
    </CardContent>
  );
};

export default ChatContent;
