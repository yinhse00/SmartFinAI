
import React, { useState } from 'react';
import APIKeyDialog from './APIKeyDialog';
import ChatContainer from './ChatContainer';
import { useChatLogic } from './useChatLogic';
import { useLanguageDetection } from './hooks/useLanguageDetection';
import { useMessageTranslator } from './translation/MessageTranslator';
import { useOptimizedWorkflowProcessor } from './hooks/useOptimizedWorkflowProcessor';
import { useWorkflowStageMapping } from './hooks/useWorkflowStageMapping';
import { useFileHandling } from './hooks/useFileHandling';
import ApiConnectionStatus from './ApiConnectionStatus';

const ChatInterface: React.FC = () => {
  const {
    messages,
    setMessages,
    clearConversationMemory,
    grokApiKeyInput,
    setGrokApiKeyInput,
    isGrokApiKeySet,
    apiKeyDialogOpen,
    setApiKeyDialogOpen,
    handleSaveApiKeys,
    input,
    setInput,
    lastQuery,
    handleSend,
    handleKeyDown,
    processQuery,
    retryLastQuery,
    isBatching,
    currentBatchNumber,
    handleContinueBatch
  } = useChatLogic();

  // Add local state for setLastQuery since it's missing from useChatLogic
  const [localLastQuery, setLocalLastQuery] = useState('');

  // Language detection for input and messages
  const { 
    lastUserMessageIsChinese, 
    isTraditionalChinese, 
    isSimplifiedChinese 
  } = useLanguageDetection(messages, input);

  // Workflow stage mapping
  const { getCurrentStep } = useWorkflowStageMapping();
  
  // Use optimized workflow processor instead of regular one
  const { 
    isLoading, 
    processingStage, 
    executeOptimizedWorkflow 
  } = useOptimizedWorkflowProcessor({
    messages,
    setMessages,
    setLastQuery: setLocalLastQuery,
    isGrokApiKeySet,
    setApiKeyDialogOpen
  });

  // Translation functionality for Chinese inputs
  const { translatingMessageIds } = useMessageTranslator({
    messages,
    setMessages,
    lastInputWasChinese: lastUserMessageIsChinese,
    isTraditionalChinese: isTraditionalChinese,
    isLoading
  });

  // File handling functionality
  const {
    attachedFiles,
    handleFileSelect,
    removeAttachedFile,
    hasAttachedFiles,
    isProcessing,
    isOfflineMode,
    tryReconnect,
    handleSendWithFiles
  } = useFileHandling({
    input,
    setInput,
    executeOptimizedWorkflow,
    lastUserMessageIsChinese
  });

  return (
    <>
      <div className="w-full mx-auto py-6 relative">
        <ApiConnectionStatus 
          onOpenApiKeyDialog={() => setApiKeyDialogOpen(true)}
          isOfflineMode={isOfflineMode}
          onTryReconnect={tryReconnect}
        />
        
        <ChatContainer
          messages={messages}
          isLoading={isLoading || isProcessing}
          isGrokApiKeySet={isGrokApiKeySet}
          input={input}
          setInput={setInput}
          handleSend={handleSendWithFiles}
          handleKeyDown={hasAttachedFiles ? 
            (e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleSendWithFiles();
              }
            } : 
            handleKeyDown
          }
          onOpenApiKeyDialog={() => setApiKeyDialogOpen(true)}
          retryLastQuery={retryLastQuery}
          onFileSelect={handleFileSelect}
          isProcessingFiles={isProcessing}
          attachedFiles={attachedFiles}
          onFileRemove={removeAttachedFile}
          isOfflineMode={isOfflineMode}
          onTryReconnect={tryReconnect}
          translatingMessageIds={translatingMessageIds}
          currentStep={getCurrentStep()}
          stepProgress={getCurrentStep()}
        />
      </div>
      
      <APIKeyDialog
        open={apiKeyDialogOpen}
        onOpenChange={setApiKeyDialogOpen}
        grokApiKeyInput={grokApiKeyInput}
        setGrokApiKeyInput={setGrokApiKeyInput}
        handleSaveApiKeys={handleSaveApiKeys}
      />
    </>
  );
};

export default ChatInterface;
