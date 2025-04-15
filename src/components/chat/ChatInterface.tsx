
import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import KnowledgePanel from './KnowledgePanel';
import APIKeyDialog from './APIKeyDialog';
import ChatContainer from './ChatContainer';
import { useChatLogic } from './useChatLogic';
import { useToast } from '@/hooks/use-toast';
import { detectTruncationComprehensive, isTradingArrangementComplete } from '@/utils/truncationUtils';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { needsEnhancedTokenSettings } from './utils/parameterUtils';

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
    apiKeyDialogOpen,
    setApiKeyDialogOpen,
    handleSaveApiKeys,
    handleSend,
    handleKeyDown,
    retryLastQuery
  } = useChatLogic();

  // Enhanced truncation detection for incomplete responses
  useEffect(() => {
    if (messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      
      // Only check bot messages that aren't already marked as truncated
      if (lastMessage.sender === 'bot' && 
          lastMessage.content && 
          !lastMessage.isTruncated) {
        
        const content = lastMessage.content;
        const queryType = lastMessage.queryType;
        
        // Enhanced detection using multiple methods
        const isPotentiallyTruncated = detectTruncationComprehensive(content);
        
        // For trading arrangement related queries, perform specialized check
        const previousUserMessage = messages.length > 1 ? 
          messages[messages.length - 2].content : '';
          
        const isTradingRelated = queryType && 
          ['rights_issue', 'open_offer', 'share_consolidation', 'board_lot_change', 'company_name_change']
            .includes(queryType);
            
        const isTradingArrangementIncomplete = isTradingRelated && 
          !isTradingArrangementComplete(content, queryType);
          
        // Check for expected content pattern in rights issue responses
        const isRightsIssueWithMissingContent = queryType === 'rights_issue' && 
          content.includes('timetable') && 
          !content.includes('Record Date') && 
          !content.toLowerCase().includes('ex-rights');

        if (isPotentiallyTruncated || isTradingArrangementIncomplete || isRightsIssueWithMissingContent) {
          // Mark the message as truncated
          const updatedMessages = [...messages];
          updatedMessages[updatedMessages.length - 1].isTruncated = true;
          setMessages(updatedMessages);
          
          // Show toast with retry option
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
      <div className="flex-1 flex gap-4">
        {/* Financial Expert Chat Window */}
        <div className="flex-1 flex flex-col">
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

        {/* Hong Kong Financial Knowledge Panel */}
        <KnowledgePanel />
      </div>

      {/* API Key Dialog for Financial Expert Access */}
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
