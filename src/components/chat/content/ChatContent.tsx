
import React, { useRef, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import WorkflowIndicator from '../workflow/WorkflowIndicator';
import ChatHistory from '../ChatHistory';
import ChatLoadingIndicator from '../ChatLoadingIndicator';
import ProcessingIndicator from '../ProcessingIndicator';
import { Message } from '../ChatMessage';

interface ChatContentProps {
  messages: Message[];
  isLoading: boolean;
  onRetry?: () => void;
  translatingMessageIds?: string[];
  isOfflineMode?: boolean;
  currentStep?: 'initial' | 'listingRules' | 'takeoversCode' | 'execution' | 'response' | 'complete';
  stepProgress?: string;
  isApiKeyRotating?: boolean;
}

// Updated props interface for ChatHistory
interface ChatHistoryProps {
  messages: Message[];
  isLoading: boolean;
  onRetry?: () => void;
  translatingMessageIds?: string[];
  isApiKeyRotating?: boolean;  // Added this prop
}

const ChatContent: React.FC<ChatContentProps> = ({
  messages,
  isLoading,
  onRetry,
  translatingMessageIds = [],
  isOfflineMode = false,
  currentStep = 'initial',
  stepProgress = 'Preparing your request',
  isApiKeyRotating = false
}) => {
  const contentRef = useRef<HTMLDivElement>(null);
  
  // Scroll to bottom on new messages or loading state change
  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.scrollTop = contentRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  return (
    <Card className="h-full flex-1 overflow-hidden border-0 bg-transparent flex flex-col">
      {(isLoading || currentStep !== 'initial') && (
        <WorkflowIndicator 
          currentStep={currentStep} 
          stepProgress={stepProgress}
          isApiKeyRotating={isApiKeyRotating}
        />
      )}
      
      <div 
        ref={contentRef} 
        className="messages-container flex-1 overflow-y-auto p-4 space-y-4"
      >
        <ChatHistory 
          messages={messages} 
          isLoading={isLoading} 
          onRetry={onRetry} 
          translatingMessageIds={translatingMessageIds}
          isApiKeyRotating={isApiKeyRotating}
        />
        
        {isLoading && (
          <>
            {isOfflineMode ? (
              <ProcessingIndicator stage={currentStep} progress={stepProgress} />
            ) : (
              <ChatLoadingIndicator />
            )}
          </>
        )}
      </div>
    </Card>
  );
};

export default ChatContent;
