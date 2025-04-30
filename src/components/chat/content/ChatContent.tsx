
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
  isApiKeyRotating?: boolean; // New prop for showing API key rotation status
}

const ChatContent: React.FC<ChatContentProps> = ({
  messages,
  isLoading,
  onRetry,
  translatingMessageIds = [],
  isOfflineMode = false,
  currentStep,
  stepProgress,
  isApiKeyRotating = false
}) => {
  return <CardContent className="flex-1 p-0 overflow-auto max-h-[calc(100vh-25rem)] md:max-h-[calc(100vh-20rem)] min-h-[400px] flex flex-col bg-zinc-50">
      <div className="sticky top-0 z-10 bg-background">
        {currentStep && stepProgress && <WorkflowIndicator 
          currentStep={currentStep} 
          stepProgress={stepProgress} 
          isApiKeyRotating={isApiKeyRotating}
        />}
      </div>
      <ChatHistory 
        messages={messages} 
        isLoading={isLoading} 
        onRetry={onRetry} 
        translatingMessageIds={translatingMessageIds} 
        isApiKeyRotating={isApiKeyRotating} 
      />
    </CardContent>;
};

export default ChatContent;
