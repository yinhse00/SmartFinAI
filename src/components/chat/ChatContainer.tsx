
import React from 'react';
import { Card } from '@/components/ui/card';
import ChatHeader from './ChatHeader';
import ChatContent from './content/ChatContent';
import ChatInput from './ChatInput';
import { Message } from './ChatMessage';
import { useLanguageDetection } from './hooks/useLanguageDetection';
import { useToast } from '@/hooks/use-toast';
import { WorkflowPhase } from './workflow/workflowConfig';

interface ChatContainerProps {
  messages: Message[];
  isLoading: boolean;
  isGrokApiKeySet: boolean;
  input: string;
  setInput: (input: string) => void;
  handleSend: () => void;
  handleKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onOpenApiKeyDialog: () => void;
  retryLastQuery?: () => void;
  translatingMessageIds?: string[];
  onFileSelect?: (files: FileList) => void;
  isProcessingFiles?: boolean;
  attachedFiles?: File[];
  onFileRemove?: (index: number) => void;
  isOfflineMode?: boolean;
  onTryReconnect?: () => Promise<boolean>;
  currentStep?: WorkflowPhase;
  stepProgress?: string;
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
  translatingMessageIds = [],
  onFileSelect,
  isProcessingFiles = false,
  attachedFiles = [],
  onFileRemove,
  isOfflineMode = false,
  onTryReconnect,
  currentStep = WorkflowPhase.ANALYSIS,
  stepProgress = ''
}) => {
  // Debug log to track message status
  if (translatingMessageIds.length > 0) {
    console.log(`Currently translating ${translatingMessageIds.length} messages: ${translatingMessageIds.join(', ')}`);
  }
  
  const { lastUserMessageIsChinese, getPlaceholder } = useLanguageDetection(messages, input);
  const { toast } = useToast();
  
  // Handle file uploads if no explicit handler is provided
  const handleFileSelect = (files: FileList) => {
    if (onFileSelect) {
      onFileSelect(files);
    } else {
      toast({
        title: "Files selected",
        description: `${files.length} file(s) selected. File handling will be implemented soon.`,
      });
    }
  };
  
  return (
    <Card className="finance-card h-full flex flex-col w-full max-w-full">
      <ChatHeader 
        isGrokApiKeySet={isGrokApiKeySet} 
        onOpenApiKeyDialog={onOpenApiKeyDialog} 
        isOfflineMode={isOfflineMode}
      />
      
      <ChatContent
        messages={messages}
        isLoading={isLoading}
        onRetry={retryLastQuery}
        translatingMessageIds={translatingMessageIds}
        isOfflineMode={isOfflineMode}
        onTryReconnect={onTryReconnect}
        currentStep={currentStep}
        stepProgress={stepProgress}
      />
      
      <ChatInput 
        input={input}
        setInput={setInput}
        handleSend={handleSend}
        isLoading={isLoading}
        isGrokApiKeySet={isGrokApiKeySet}
        onOpenApiKeyDialog={onOpenApiKeyDialog}
        handleKeyDown={handleKeyDown}
        placeholder={getPlaceholder()}
        onFileSelect={handleFileSelect}
        isProcessingFiles={isProcessingFiles}
        attachedFiles={attachedFiles}
        onFileRemove={onFileRemove}
        isOfflineMode={isOfflineMode}
      />
    </Card>
  );
};

export default ChatContainer;
