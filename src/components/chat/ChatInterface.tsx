
import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import APIKeyDialog from './APIKeyDialog';
import ChatContainer from './ChatContainer';
import ProcessingIndicator from './ProcessingIndicator';
import ApiConnectionStatus from './ApiConnectionStatus';
import { useChatLogic } from './useChatLogic';
import { useToast } from '@/hooks/use-toast';
import {
  analyzeFinancialResponse
} from '@/utils/truncation';
import { Button } from '@/components/ui/button';
import { RefreshCw, Database } from 'lucide-react';

const ChatInterface = () => {
  const { toast } = useToast();
  const {
    input,
    setInput,
    grokApiKeyInput,
    setGrokApiKeyInput,
    isGrokApiKeySet,
    messages,
    setMessages,
    isLoading,
    processingStage,
    apiKeyDialogOpen,
    setApiKeyDialogOpen,
    handleSaveApiKeys,
    handleSend,
    handleKeyDown,
    retryLastQuery,
    // Batch/continue:
    isBatching,
    currentBatchNumber,
    handleContinueBatch,
    autoBatch
  } = useChatLogic();

  // Enhanced truncation detection for incomplete responses
  useEffect(() => {
    if (messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      if (
        lastMessage.sender === 'bot' &&
        lastMessage.content &&
        !lastMessage.isTruncated
      ) {
        const content = lastMessage.content;
        const queryType = lastMessage.queryType || '';
        const financialAnalysis = analyzeFinancialResponse(content, queryType);
        const isTruncated = financialAnalysis.isComplete === false;
        if (isTruncated) {
          console.log('Response appears incomplete:', {
            financialAnalysis: financialAnalysis.missingElements
          });
          const updatedMessages = [...messages];
          updatedMessages[updatedMessages.length - 1].isTruncated = true;
          setMessages(updatedMessages);

          toast({
            title: "Incomplete Response",
            description: "The response appears to have been cut off. You can retry your query to get a complete answer.",
            duration: 15000,
            action: <Button
              onClick={retryLastQuery}
              variant="outline"
              size="sm"
              className="flex items-center gap-1 bg-finance-light-blue/20 hover:bg-finance-light-blue/40 text-finance-dark-blue hover:text-finance-dark-blue"
            >
              <RefreshCw size={14} />
              Retry query
            </Button>
          });
        }
      }
    }
  }, [messages, toast, retryLastQuery, setMessages]);

  return (
    <div className="flex flex-col h-[calc(100vh-14rem)]">
      <div className="flex-1">
        {/* API Connection Status */}
        <ApiConnectionStatus onOpenApiKeyDialog={() => setApiKeyDialogOpen(true)} />

        {/* SmartFinAI Chat Window */}
        <div className="flex-1 flex flex-col">
          {/* Show processing indicator with all stages */}
          {isLoading && <ProcessingIndicator isVisible={true} stage={processingStage} />}

          {/* Enhanced database review status indicator */}
          {isLoading && processingStage === 'reviewing' && (
            <div className="flex items-center justify-center mb-2 gap-2 text-xs text-finance-medium-blue dark:text-finance-light-blue">
              <Database size={14} className="animate-pulse" />
              <span className="font-medium">Reviewing database for accurate information...</span>
              <span className="text-[10px] bg-finance-light-blue/20 dark:bg-finance-medium-blue/30 px-1.5 py-0.5 rounded-full">
                Consulting HK regulatory database
              </span>
            </div>
          )}

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
          />

          {/* Multi-part batch answer controls */}
          {isBatching && !autoBatch && (
            <div className="flex justify-center my-4">
              <Button
                variant="default"
                className="flex items-center gap-2 bg-finance-accent-blue text-white"
                onClick={handleContinueBatch}
              >
                <RefreshCw size={16} /> Continue to Next Part (Part {currentBatchNumber + 1})
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* API Key Dialog */}
      <APIKeyDialog
        open={apiKeyDialogOpen}
        onOpenChange={setApiKeyDialogOpen}
        grokApiKeyInput={grokApiKeyInput}
        setGrokApiKeyInput={setGrokApiKeyInput}
        onSave={handleSaveApiKeys}
      />
    </div>
  );
};

export default ChatInterface;
