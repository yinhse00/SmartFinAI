
import React from 'react';
import { Card } from '@/components/ui/card';
import ChatHeader from './ChatHeader';
import ChatContent from './content/ChatContent';
import ChatInput from './ChatInput';
import { Message } from './ChatMessage';

interface ChatContainerProps {
  messages: Message[];
  isLoading: boolean;
  isGrokApiKeySet: boolean;
  input: string;
  setInput: React.Dispatch<React.SetStateAction<string>>;
  handleSend: () => void;
  handleKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  onOpenApiKeyDialog: () => void;
  retryLastQuery?: () => void;
  onFileSelect?: (files: FileList) => void;
  isProcessingFiles?: boolean;
  attachedFiles?: File[];
  onFileRemove?: (index: number) => void;
  isOfflineMode?: boolean;
  currentStep?: 'initial' | 'listingRules' | 'takeoversCode' | 'execution' | 'response' | 'complete';
  stepProgress?: string;
  onTryReconnect?: () => Promise<boolean>;
}

const ChatContainer: React.FC<ChatContainerProps> = ({
  messages,
  isLoading,
  isGrokApiKeySet,
  input,
  setInput,
  handleSend,
  handleKeyDown,
  onOpenApiKeyDialog,
  retryLastQuery,
  onFileSelect,
  isProcessingFiles,
  attachedFiles = [],
  onFileRemove,
  isOfflineMode = false,
  currentStep,
  stepProgress,
  onTryReconnect
}) => {
  return (
    <Card className="border shadow-sm flex flex-col h-[calc(100vh-14rem)]">
      <ChatHeader 
        isGrokApiKeySet={isGrokApiKeySet} 
        onOpenApiKeyDialog={onOpenApiKeyDialog}
        isOfflineMode={isOfflineMode}
        onTryReconnect={onTryReconnect}
      />
      
      <ChatContent 
        messages={messages} 
        isLoading={isLoading} 
        onRetry={retryLastQuery}
        isOfflineMode={isOfflineMode}
        currentStep={currentStep}
        stepProgress={stepProgress}
      />
      
      <ChatInput
        input={input}
        setInput={setInput}
        handleSend={handleSend}
        handleKeyDown={handleKeyDown}
        disabled={isLoading}
        isLoading={isLoading}  // Added the required isLoading prop
        onFileSelect={onFileSelect}
        isProcessingFiles={isProcessingFiles}
        attachedFiles={attachedFiles}
        onFileRemove={onFileRemove}
        isOfflineMode={isOfflineMode}
      />
    </Card>
  );
};

export default ChatContainer;
