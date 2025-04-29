
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
    
    // Determine file type for better user feedback
    const fileTypes = Array.from(files).map(file => {
      if (file.type.includes('image')) return 'image';
      if (file.type.includes('pdf')) return 'PDF';
      if (file.type.includes('word') || file.name.endsWith('.doc') || file.name.endsWith('.docx')) return 'document';
      if (file.type.includes('excel') || file.name.endsWith('.xls') || file.name.endsWith('.xlsx')) return 'spreadsheet';
      return 'file';
    });
    
    // Count file types for better messaging
    const imageCount = fileTypes.filter(type => type === 'image').length;
    const documentCount = fileTypes.length - imageCount;
    
    let description = `${newFiles.length} file(s) have been selected.`;
    if (imageCount > 0 && documentCount > 0) {
      description = `${imageCount} image(s) and ${documentCount} document(s) have been selected.`;
    } else if (imageCount > 0) {
      description = `${imageCount} image(s) have been selected.`;
    } else if (documentCount > 0) {
      description = `${documentCount} document(s) have been selected.`;
    }
    
    toast({
      title: "Files uploaded",
      description,
    });
    
    // Process the files to extract content
    const processedResults = await processFiles(newFiles);
    
    // Format the extracted content to add to the input
    if (processedResults.length > 0) {
      const extractedContent = processedResults.map(result => result.content).join('\n\n');
      
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
          isProcessingFiles={isProcessing}
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
