
import { useState } from 'react';
import APIKeyDialog from './APIKeyDialog';
import ChatContainer from './ChatContainer';
import ProcessingIndicator from './ProcessingIndicator';
import ApiConnectionStatus from './ApiConnectionStatus';
import { useChatLogic } from './useChatLogic';
import { Button } from '@/components/ui/button';
import { Database, BookOpen, FileText, BarChart2, MessageSquare } from 'lucide-react';
import { useMessageTranslator } from './translation/MessageTranslator';
import { useTruncationAnalyzer } from './analysis/TruncationAnalyzer';
import BatchContinuation from './batch/BatchContinuation';
import WorkflowIndicator from './workflow/WorkflowIndicator';
import { WorkflowStep } from './hooks/workflow/types';

const ChatInterface = () => {
  const {
    input,
    setInput,
    grokApiKeyInput,
    setGrokApiKeyInput,
    isGrokApiKeySet,
    messages,
    setMessages,
    isLoading,
    currentStep,
    stepProgress,
    apiKeyDialogOpen,
    setApiKeyDialogOpen,
    handleSaveApiKeys,
    handleSend,
    handleKeyDown,
    retryLastQuery,
    isBatching,
    currentBatchNumber,
    handleContinueBatch,
    autoBatch,
    lastInputWasChinese
  } = useChatLogic();
  
  // Use the extracted message translation logic
  const { translatingMessageIds } = useMessageTranslator({
    messages,
    setMessages,
    lastInputWasChinese,
    isLoading
  });
  
  // Use the extracted truncation analysis logic
  useTruncationAnalyzer({
    messages,
    setMessages,
    retryLastQuery,
    lastInputWasChinese
  });

  // Helper function to map workflow steps to processing stage
  const mapWorkflowToProcessingStage = (workflowStep: WorkflowStep): 'preparing' | 'processing' | 'finalizing' | 'reviewing' => {
    switch (workflowStep) {
      case 'initial':
        return 'preparing';
      case 'listingRules':
      case 'takeoversCode':
        return 'reviewing';
      case 'execution':
        return 'processing';
      case 'response':
      case 'complete':
      default:
        return 'finalizing';
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-14rem)]">
      <div className="flex-1">
        <ApiConnectionStatus onOpenApiKeyDialog={() => setApiKeyDialogOpen(true)} />

        <div className="flex-1 flex flex-col">
          {isLoading && <ProcessingIndicator 
            isVisible={true} 
            stage={mapWorkflowToProcessingStage(currentStep)} 
          />}

          {isLoading && <WorkflowIndicator 
            currentStep={currentStep} 
            stepProgress={stepProgress}
          />}

          <ChatContainer
            messages={messages}
            isLoading={isLoading}
            isGrokApiKeySet={isGrokApiKeySet}
            input={input}
            setInput={setInput}
            handleSend={handleSend}
            handleKeyDown={handleKeyDown}
            onOpenApiKeyDialog={() => setApiKeyDialogOpen(true)}
            retryLastQuery={retryLastQuery}
            translatingMessageIds={translatingMessageIds}
          />

          <BatchContinuation 
            isBatching={isBatching}
            autoBatch={autoBatch}
            currentBatchNumber={currentBatchNumber}
            handleContinueBatch={handleContinueBatch}
            lastInputWasChinese={lastInputWasChinese}
          />
        </div>
      </div>

      <APIKeyDialog
        open={apiKeyDialogOpen}
        onOpenChange={setApiKeyDialogOpen}
        grokApiKeyInput={grokApiKeyInput}
        setGrokApiKeyInput={setGrokApiKeyInput}
        onSave={handleSaveApiKeys}
      />
    </div>
  );
};

export default ChatInterface;
