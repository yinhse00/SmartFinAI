
import React, { useEffect } from 'react';
import APIKeyDialog from './APIKeyDialog';
import ChatContainer from './ChatContainer';
import { useChatLogic } from './useChatLogic';
import { useToast } from '@/hooks/use-toast';
import { useFileProcessing } from '@/hooks/useFileProcessing';
import { useFileAttachments } from '@/hooks/useFileAttachments';
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
    isLoading,
    handleSend,
    handleKeyDown,
    processQuery,
    retryLastQuery,
    currentStep,
    stepProgress,
    isBatching,
    currentBatchNumber,
    handleContinueBatch,
    isApiKeyRotating // Get the API key rotation status
  } = useChatLogic();

  const { toast } = useToast();
  const { 
    processFiles, 
    isProcessing, 
    isOfflineMode, 
    tryReconnect 
  } = useFileProcessing();
  
  const { 
    attachedFiles, 
    handleFileSelect, 
    clearAttachedFiles, 
    removeAttachedFile, 
    hasAttachedFiles 
  } = useFileAttachments();

  // Show warning if in offline mode and there are attached files
  useEffect(() => {
    if (isOfflineMode && hasAttachedFiles) {
      toast({
        title: "Limited File Processing",
        description: "You're in offline mode. File processing will be limited.",
        variant: "destructive", // Changed from "warning" to "destructive"
        duration: 5000,
      });
    }
  }, [isOfflineMode, hasAttachedFiles, toast]);

  // Modified send handler that processes files before sending the message
  const handleSendWithFiles = async () => {
    if (hasAttachedFiles) {
      toast({
        title: "Processing files",
        description: `Processing ${attachedFiles.length} file(s) before sending your message...`,
      });
      
      const processedResults = await processFiles(attachedFiles);
      
      // Format the extracted content to add to the input
      if (processedResults.length > 0) {
        const extractedContent = processedResults.map(result => result.content).join('\n\n');
        
        const separator = input ? '\n\n' : '';
        const enrichedInput = input + separator + extractedContent;
        
        // Process the combined query
        processQuery(enrichedInput);
        
        // Clear the files and input after sending
        clearAttachedFiles();
        setInput('');
      }
    } else {
      // Normal send without files
      handleSend();
    }
  };

  // Custom key handler for textarea with file attachments - explicitly typed for HTMLTextAreaElement
  const handleAttachmentsKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendWithFiles();
    }
  };

  return (
    <>
      <div className="container mx-auto py-6">
        <ApiConnectionStatus 
          onOpenApiKeyDialog={() => setApiKeyDialogOpen(true)}
          isOfflineMode={isOfflineMode}
          onTryReconnect={tryReconnect}
          isApiKeyRotating={isApiKeyRotating} // Pass API key rotation status
        />
        
        <ChatContainer
          messages={messages}
          isLoading={isLoading || isProcessing}
          isGrokApiKeySet={isGrokApiKeySet}
          input={input}
          setInput={setInput}
          handleSend={handleSendWithFiles}
          handleKeyDown={hasAttachedFiles ? handleAttachmentsKeyDown : handleKeyDown}
          onOpenApiKeyDialog={() => setApiKeyDialogOpen(true)}
          retryLastQuery={retryLastQuery}
          onFileSelect={handleFileSelect}
          isProcessingFiles={isProcessing}
          attachedFiles={attachedFiles}
          onFileRemove={removeAttachedFile}
          isOfflineMode={isOfflineMode}
          currentStep={currentStep}
          stepProgress={stepProgress}
          isApiKeyRotating={isApiKeyRotating} // Pass API key rotation status
          isBatching={isBatching}
          currentBatchNumber={currentBatchNumber}
          handleContinueBatch={handleContinueBatch}
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
