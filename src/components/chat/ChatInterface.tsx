
import React, { useEffect, useState } from 'react';
import APIKeyDialog from './APIKeyDialog';
import ChatContainer from './ChatContainer';
import { useChatLogic } from './useChatLogic';
import { useToast } from '@/hooks/use-toast';
import { useFileProcessing } from '@/hooks/useFileProcessing';
import { useFileAttachments } from '@/hooks/useFileAttachments';
import ApiConnectionStatus from './ApiConnectionStatus';

const ChatInterface: React.FC = () => {
  // Performance tracking state
  const [isFirstResponse, setIsFirstResponse] = useState(true);
  const [responseStartTime, setResponseStartTime] = useState<number | null>(null);

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
    handleContinueBatch
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

  // Track response performance metrics
  useEffect(() => {
    if (isLoading && responseStartTime === null) {
      // Start timing when loading begins
      setResponseStartTime(Date.now());
      console.log('Response generation started');
    } else if (!isLoading && responseStartTime !== null) {
      // Calculate response time when loading finishes
      const responseTime = Date.now() - responseStartTime;
      console.log(`Response completed in ${responseTime}ms. First response: ${isFirstResponse}`);
      
      // Reset timing and update first response flag
      setResponseStartTime(null);
      if (isFirstResponse) {
        setIsFirstResponse(false);
      }
    }
  }, [isLoading, responseStartTime, isFirstResponse]);

  // Show warning if in offline mode and there are attached files
  useEffect(() => {
    if (isOfflineMode && hasAttachedFiles) {
      toast({
        title: "Limited File Processing",
        description: "You're in offline mode. File processing will be limited.",
        variant: "destructive",
        duration: 5000,
      });
    }
  }, [isOfflineMode, hasAttachedFiles, toast]);

  // Optimized send handler with improved error handling
  const handleSendWithFiles = async () => {
    try {
      if (hasAttachedFiles) {
        toast({
          title: "Processing files",
          description: `Processing ${attachedFiles.length} file(s) before sending your message...`,
        });
        
        const processedResults = await processFiles(attachedFiles);
        
        if (processedResults.length > 0) {
          const extractedContent = processedResults.map(result => result.content).join('\n\n');
          
          const separator = input ? '\n\n' : '';
          const enrichedInput = input + separator + extractedContent;
          
          // Process the combined query with performance tracking
          processQuery(enrichedInput);
          
          // Clear the files and input after sending
          clearAttachedFiles();
          setInput('');
        } else {
          // Handle case when files couldn't be processed
          toast({
            title: "File processing issue",
            description: "Could not extract content from the files. Please try again.",
            variant: "destructive"
          });
        }
      } else {
        // Normal send without files
        handleSend();
      }
    } catch (error) {
      console.error("Error in message sending:", error);
      toast({
        title: "Error sending message",
        description: "There was an issue sending your message. Please try again.",
        variant: "destructive"
      });
    }
  };

  // Create a type-compatible keyboard handler function
  const handleTextAreaKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (hasAttachedFiles) {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSendWithFiles();
      }
    } else {
      // Modified to handle textarea events
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        if (input.trim()) {
          handleSend();
        }
      }
    }
  };

  return (
    <>
      <div className="w-full mx-auto py-6">
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
          handleKeyDown={handleTextAreaKeyDown}
          onOpenApiKeyDialog={() => setApiKeyDialogOpen(true)}
          retryLastQuery={retryLastQuery}
          onFileSelect={handleFileSelect}
          isProcessingFiles={isProcessing}
          attachedFiles={attachedFiles}
          onFileRemove={removeAttachedFile}
          isOfflineMode={isOfflineMode}
          currentStep={currentStep}
          stepProgress={stepProgress}
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
