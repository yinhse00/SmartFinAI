
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
import PresentationView from '../presentation/PresentationView';

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

  // Presentation mode state
  const [isPresentationMode, setIsPresentationMode] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [presentationContent, setPresentationContent] = useState('');

  // Update presentation content when new message arrives
  useEffect(() => {
    if (messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage.sender === 'bot' && lastMessage.content) {
        setPresentationContent(lastMessage.content);
      }
    }
  }, [messages]);

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

  // Removed the complex financial query detection and alert
  
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

  // Toggle fullscreen mode for presentation
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => {
        toast({
          title: "Fullscreen Error",
          description: "Could not enter fullscreen mode: " + err.message,
          variant: "destructive"
        });
      });
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
        setIsFullscreen(false);
      }
    }
  };

  return (
    <>
      <div className="container mx-auto py-6 relative">
        <ApiConnectionStatus 
          onOpenApiKeyDialog={() => setApiKeyDialogOpen(true)}
          isOfflineMode={isOfflineMode}
          onTryReconnect={tryReconnect}
        />
        
        {/* Removed the financial query alert component that was here */}
        
        {/* Processing overlay for when the system is working */}
        {isLoading && <ProcessingOverlay 
          currentStep={currentStep}
          stepProgress={stepProgress}
          isChineseInterface={lastUserMessageIsChinese}
        />}
        
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
          onPresentationMode={() => setIsPresentationMode(true)}
          hasResponse={presentationContent.length > 0}
        />
      </div>
      
      {/* Presentation View */}
      <PresentationView 
        content={presentationContent}
        isOpen={isPresentationMode}
        onClose={() => setIsPresentationMode(false)}
        onToggleFullscreen={toggleFullscreen}
        isFullscreen={isFullscreen}
      />
      
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
