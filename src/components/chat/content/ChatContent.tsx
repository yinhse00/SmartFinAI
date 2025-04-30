
import React from 'react';
import { CardContent } from '@/components/ui/card';
import ChatHistory from '../ChatHistory';
import { Message } from '../ChatMessage';
import WorkflowIndicator from '../workflow/WorkflowIndicator';

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
    <CardContent 
      className="flex-1 p-0 overflow-auto max-h-[calc(100vh-22rem)] md:max-h-[calc(100vh-18rem)] min-h-[500px] flex flex-col"
    >
      <div className="sticky top-0 z-10 bg-background">
        {currentStep && stepProgress && (
          <WorkflowIndicator currentStep={currentStep} stepProgress={stepProgress} />
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
