
import React, { useEffect, useState } from 'react';
import APIKeyDialog from './APIKeyDialog';
import ChatContainer from './ChatContainer';
import { useChatLogic } from './useChatLogic';
import { useToast } from '@/hooks/use-toast';
import { useFileProcessing } from '@/hooks/useFileProcessing';
import { useFileAttachments } from '@/hooks/useFileAttachments';
import ApiConnectionStatus from './ApiConnectionStatus';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { FileWarning } from 'lucide-react';

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

  // Check if input contains complex financial query terms
  const [isComplexFinancialQuery, setIsComplexFinancialQuery] = useState(false);
  
  useEffect(() => {
    // Keywords that indicate a complex financial query
    const complexQueryKeywords = [
      'rights issue',
      'whitewash waiver',
      'very substantial acquisition',
      'connected transaction',
      'timetable',
      'chapter 14a',
      'aggregate',
      'takeovers code'
    ];
    
    // Check if input contains any of the complex query keywords
    const hasComplexQueryTerms = complexQueryKeywords.some(keyword => 
      input.toLowerCase().includes(keyword)
    );
    
    // Multiple complex keywords or long query with at least one keyword
    const isComplex = (input.split(' ').length > 15 && hasComplexQueryTerms) || 
                    complexQueryKeywords.filter(keyword => 
                      input.toLowerCase().includes(keyword)
                    ).length > 1;
    
    setIsComplexFinancialQuery(isComplex);
  }, [input]);

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

  return (
    <>
      <div className="container mx-auto py-6">
        <ApiConnectionStatus 
          onOpenApiKeyDialog={() => setApiKeyDialogOpen(true)}
          isOfflineMode={isOfflineMode}
          onTryReconnect={tryReconnect}
        />
        
        {isComplexFinancialQuery && (
          <Alert className="mb-4 bg-blue-50 border-blue-200 dark:bg-blue-950/20 dark:border-blue-800">
            <FileWarning className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <AlertDescription>
              You're asking about a complex financial topic. For best results with topics like rights issues, 
              timetables, or whitewash waivers, consider breaking your query into smaller, more focused questions.
            </AlertDescription>
          </Alert>
        )}
        
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
