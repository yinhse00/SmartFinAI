
import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import APIKeyDialog from './APIKeyDialog';
import ChatContainer from './ChatContainer';
import ProcessingIndicator from './ProcessingIndicator';
import ApiConnectionStatus from './ApiConnectionStatus';
import { StyledTable } from '@/components/ui/styled-table';
import { useChatLogic } from './useChatLogic';
import { useToast } from '@/hooks/use-toast';
import { 
  analyzeFinancialResponse
} from '@/utils/truncation';
import { Button } from '@/components/ui/button';
import { RefreshCw, Database, Table as TableIcon } from 'lucide-react';

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

  // State to manage table view for results
  const [tableResults, setTableResults] = useState<{
    headers: string[];
    rows: (string | number)[][];
  } | null>(null);

  // Enhanced truncation detection for incomplete responses
  useEffect(() => {
    if (messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      
      // Check if the last message contains tabular data
      if (lastMessage.sender === 'bot' && lastMessage.content) {
        // Basic table detection (you might want to improve this detection logic)
        const tableMatch = lastMessage.content.match(/\|(.*)\|(.*)\|/);
        if (tableMatch) {
          try {
            // Simple parsing of markdown-like table
            const lines = lastMessage.content.split('\n').filter(line => line.includes('|'));
            const headers = lines[0].split('|').filter(h => h.trim()).map(h => h.trim());
            const rows = lines.slice(2).map(line => 
              line.split('|').filter(cell => cell.trim()).map(cell => cell.trim())
            );

            setTableResults({ headers, rows });
          } catch (error) {
            console.error('Failed to parse table', error);
          }
        }
      }
    }
  }, [messages]);

  return (
    <div className="flex flex-col h-[calc(100vh-14rem)]">
      <div className="flex-1">
        {/* API Connection Status */}
        <ApiConnectionStatus onOpenApiKeyDialog={() => setApiKeyDialogOpen(true)} />
        
        {/* SmartFinAI Chat Window */}
        <div className="flex-1 flex flex-col">
          {/* Show processing indicator with all stages */}
          {isLoading && <ProcessingIndicator isVisible={true} stage={processingStage} />}
          
          {/* Table Results Display */}
          {tableResults && (
            <div className="p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <TableIcon className="h-5 w-5 text-finance-medium-blue" />
                  Query Results
                </h3>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setTableResults(null)}
                >
                  Hide Table
                </Button>
              </div>
              <StyledTable 
                headers={tableResults.headers} 
                rows={tableResults.rows} 
                sortable={true}
              />
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
