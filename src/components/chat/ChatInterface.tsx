
import React, { useState } from 'react';
import APIKeyDialog from './APIKeyDialog';
import ChatContainer from './ChatContainer';
import { useChatLogic } from './useChatLogic';
import { useToast } from '@/hooks/use-toast';
import { useFileProcessing } from '@/hooks/useFileProcessing';

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

  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const { toast } = useToast();
  const { processFiles, isProcessing } = useFileProcessing();

  const handleFileSelect = async (files: FileList) => {
    const newFiles = Array.from(files);
    setSelectedFiles(prev => [...prev, ...newFiles]);
    
    toast({
      title: "Files uploaded",
      description: `${newFiles.length} file(s) have been selected.`,
    });
    
    // Process the files to extract content
    const processedResults = await processFiles(newFiles);
    
    // Format the extracted content to add to the input
    if (processedResults.length > 0) {
      const extractedContent = processedResults.map(result => 
        `[From ${result.source}]:\n${result.content}`
      ).join('\n\n');
      
      setInput(prev => {
        const separator = prev ? '\n\n' : '';
        return prev + separator + extractedContent;
      });
    }
  };

  return (
    <>
      <div className="container mx-auto py-6">
        <ChatContainer
          messages={messages}
          isLoading={isLoading || isProcessing}
          isGrokApiKeySet={isGrokApiKeySet}
          input={input}
          setInput={setInput}
          handleSend={handleSend}
          handleKeyDown={handleKeyDown}
          onOpenApiKeyDialog={() => setApiKeyDialogOpen(true)}
          retryLastQuery={retryLastQuery}
          onFileSelect={handleFileSelect}
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
