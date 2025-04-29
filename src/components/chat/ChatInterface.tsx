
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

  // Helper function to render the appropriate workflow indicator
  const renderWorkflowIndicator = () => {
    if (!isLoading) return null;
    
    const getIcon = () => {
      switch (currentStep) {
        case 'initial':
          return <MessageSquare size={14} className="animate-pulse" />;
        case 'listingRules':
          return <BookOpen size={14} className="animate-pulse" />;
        case 'takeoversCode':
          return <FileText size={14} className="animate-pulse" />;
        case 'execution':
          return <BarChart2 size={14} className="animate-pulse" />;
        default:
          return <Database size={14} className="animate-pulse" />;
      }
    };
    
    return (
      <div className="flex items-center justify-center mb-2 gap-2 text-xs text-finance-medium-blue dark:text-finance-light-blue">
        {getIcon()}
        <span className="font-medium">{stepProgress}</span>
        <span className="text-[10px] bg-finance-light-blue/20 dark:bg-finance-medium-blue/30 px-1.5 py-0.5 rounded-full">
          {currentStep === 'initial' && 'Analyzing query'}
          {currentStep === 'listingRules' && 'Checking Listing Rules'}
          {currentStep === 'takeoversCode' && 'Reviewing Takeovers Code'}
          {currentStep === 'execution' && 'Finding execution guidance'}
          {currentStep === 'response' && 'Preparing response'}
        </span>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-[calc(100vh-14rem)]">
      <div className="flex-1">
        <ApiConnectionStatus onOpenApiKeyDialog={() => setApiKeyDialogOpen(true)} />

        <div className="flex-1 flex flex-col">
          {isLoading && <ProcessingIndicator isVisible={true} stage={currentStep} />}

          {renderWorkflowIndicator()}

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
