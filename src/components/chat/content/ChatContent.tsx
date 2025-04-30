
import React from 'react';
import { CardContent } from '@/components/ui/card';
import ChatHistory from '../ChatHistory';
import { Message } from '../ChatMessage';
import WorkflowIndicator from '../workflow/WorkflowIndicator';
import WorkflowStepDisplay from '../workflow/WorkflowStepDisplay';

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
  // Determine if the workflow is active
  const isWorkflowActive = Boolean(currentStep && stepProgress);

  return (
    <CardContent 
      className="flex-1 p-0 overflow-auto max-h-[calc(100vh-20rem)] md:max-h-[calc(100vh-15rem)] min-h-[450px] flex flex-col w-full"
    >
      {/* Workflow indicator section */}
      {isWorkflowActive && (
        <div className="sticky top-0 z-10 bg-background border-b">
          <WorkflowIndicator currentStep={currentStep!} stepProgress={stepProgress!} />
        </div>
      )}

      {/* Chat history with messages */}
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
