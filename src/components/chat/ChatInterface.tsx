
import React, { useState } from 'react';
import ChatContainer from './ChatContainer';
import { useChatLogic } from './useChatLogic';
import { useLanguageDetection } from './hooks/useLanguageDetection';
import { useMessageTranslator } from './translation/MessageTranslator';
import { useFileHandling } from './hooks/useFileHandling';

const ChatInterface: React.FC = () => {
  const {
    messages,
    setMessages,
    clearConversationMemory,
    isGrokApiKeySet,
    input,
    setInput,
    lastQuery,
    handleSend,
    handleKeyDown,
    processQuery,
    retryLastQuery,
    isBatching,
    currentBatchNumber,
    handleContinueBatch,
    isLoading,
    currentStep,
    stepProgress
  } = useChatLogic();

  // Language detection for input and messages
  const { 
    lastUserMessageIsChinese, 
    isTraditionalChinese, 
    isSimplifiedChinese 
  } = useLanguageDetection(messages, input);
  
  // Translation functionality for Chinese inputs
  const { translatingMessageIds } = useMessageTranslator({
    messages,
    setMessages,
    lastInputWasChinese: lastUserMessageIsChinese,
    isTraditionalChinese: isTraditionalChinese,
    isLoading
  });

  // File handling functionality - now using processQuery from useChatLogic
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
    executeOptimizedWorkflow: processQuery, // Use the unified processor
    lastUserMessageIsChinese
  });

  return (
    <>
      <div className="w-full mx-auto py-6 relative">
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
          onOpenApiKeyDialog={() => window.location.href = '/profile'}
          retryLastQuery={retryLastQuery}
          onFileSelect={handleFileSelect}
          isProcessingFiles={isProcessing}
          attachedFiles={attachedFiles}
          onFileRemove={removeAttachedFile}
          isOfflineMode={isOfflineMode}
          onTryReconnect={tryReconnect}
          translatingMessageIds={translatingMessageIds}
          currentStep={currentStep}
          stepProgress={stepProgress}
        />
      </div>
    </>
  );
};

export default ChatInterface;
