import React, { useEffect, useState } from 'react';
import APIKeyDialog from './APIKeyDialog';
import ChatContainer from './ChatContainer';
import { useChatLogic } from './useChatLogic';
import { useToast } from '@/hooks/use-toast';
import { useFileProcessing } from '@/hooks/useFileProcessing';
import { useFileAttachments } from '@/hooks/useFileAttachments';
import ApiConnectionStatus from './ApiConnectionStatus';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Languages } from 'lucide-react';
import { useMessageTranslator } from './translation/MessageTranslator';
import { useLanguageDetection } from './hooks/useLanguageDetection';
import ProcessingOverlay from './ProcessingOverlay';
import { WorkflowStep } from './hooks/workflow/types';
import { useOptimizedWorkflowProcessor } from './hooks/useOptimizedWorkflowProcessor';

// Map workflow steps to processing stages
const mapWorkflowToProcessingStage = (
  step: WorkflowStep
): 'preparing' | 'processing' | 'finalizing' | 'reviewing' => {
  switch (step) {
    case 'initial':
      return 'preparing';
    case 'listingRules':
    case 'takeoversCode':
      return 'processing';
    case 'execution':
      return 'processing';
    case 'response':
      return 'finalizing';
    case 'complete':
      return 'reviewing';
    default:
      return 'preparing';
  }
};

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
  
  // Use optimized workflow processor instead of regular one
  const { 
    isLoading, 
    processingStage, 
    executeOptimizedWorkflow 
  } = useOptimizedWorkflowProcessor({
    messages,
    setMessages,
    setLastQuery,
    isGrokApiKeySet,
    setApiKeyDialogOpen
  });

  // Modified send handler that processes files before sending the message
  const handleSendWithFiles = async () => {
    if (hasAttachedFiles) {
      toast({
        title: lastUserMessageIsChinese ? "处理文件中" : "Processing files",
        description: lastUserMessageIsChinese 
          ? `正在处理 ${attachedFiles.length} 个文件，然后发送您的消息...` 
          : `Processing ${attachedFiles.length} file(s) before sending your message...`,
      });
      
      const processedResults = await processFiles(attachedFiles);
      
      // Format the extracted content to add to the input
      if (processedResults.length > 0) {
        const extractedContent = processedResults.map(result => result.content).join('\n\n');
        
        const separator = input ? '\n\n' : '';
        const enrichedInput = input + separator + extractedContent;
        
        // Use optimized workflow for faster processing
        await executeOptimizedWorkflow(enrichedInput);
        
        // Clear the files and input after sending
        clearAttachedFiles();
        setInput('');
      }
    } else {
      // Normal send without files
      handleSendMessage();
    }
  };

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return;
    
    const query = input.trim();
    setInput('');
    
    // Use optimized workflow for faster processing
    await executeOptimizedWorkflow(query);
  };

  // Map workflow step to processing stage
  const processingStageMapped = mapWorkflowToProcessingStage(currentStep);

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
          currentStep={processingStageMapped}
          stepProgress={processingStage}
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
