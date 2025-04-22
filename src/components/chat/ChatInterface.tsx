
import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import APIKeyDialog from './APIKeyDialog';
import ChatContainer from './ChatContainer';
import ProcessingIndicator from './ProcessingIndicator';
import ApiConnectionStatus from './ApiConnectionStatus';
import { useChatLogic } from './useChatLogic';
import { useToast } from '@/hooks/use-toast';
import { analyzeFinancialResponse } from '@/utils/truncation';

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
    retryLastQuery
  } = useChatLogic();

  return (
    <div className="flex flex-col h-[calc(100vh-14rem)]">
      <div className="flex-1">
        {/* API Connection Status */}
        <ApiConnectionStatus onOpenApiKeyDialog={() => setApiKeyDialogOpen(true)} />
        
        {/* SmartFinAI Chat Window */}
        <div className="flex-1 flex flex-col">
          {/* Show processing indicator with all stages */}
          {isLoading && <ProcessingIndicator isVisible={true} stage={processingStage} />}
          
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
