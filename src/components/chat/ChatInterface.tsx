
import React, { useState } from 'react';
import APIKeyDialog from './APIKeyDialog';
import ChatContainer from './ChatContainer';
import { useChatLogic } from './useChatLogic';
import { useToast } from '@/hooks/use-toast';

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

  const handleFileSelect = (files: FileList) => {
    const newFiles = Array.from(files);
    setSelectedFiles(prev => [...prev, ...newFiles]);
    
    toast({
      title: "Files uploaded",
      description: `${newFiles.length} file(s) have been selected.`,
    });
    
    // Optionally, you could append file info to the message
    if (files.length > 0) {
      const fileNames = Array.from(files).map(file => file.name).join(', ');
      setInput(prev => prev + (prev ? '\n' : '') + `I've uploaded: ${fileNames}`);
    }
  };

  return (
    <>
      <div className="container mx-auto py-6">
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
