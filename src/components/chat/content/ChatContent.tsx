
import React from 'react';
import { CardContent } from '@/components/ui/card';
import ChatHistory from '../ChatHistory';
import { Message } from '../ChatMessage';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info } from 'lucide-react';

interface ChatContentProps {
  messages: Message[];
  isLoading: boolean;
  onRetry?: () => void;
  translatingMessageIds?: string[];
  isOfflineMode?: boolean;
  regulatoryContext?: {
    hasRegulatoryContent: boolean;
    sourceDocuments?: string[];
    relevanceScore?: number;
  };
}

const ChatContent: React.FC<ChatContentProps> = ({
  messages,
  isLoading,
  onRetry,
  translatingMessageIds = [],
  isOfflineMode = false,
  regulatoryContext
}) => {
  return (
    <CardContent 
      className="flex-1 p-0 overflow-auto max-h-[calc(100vh-25rem)] md:max-h-[calc(100vh-20rem)] min-h-[400px] flex flex-col"
    >
      {regulatoryContext?.hasRegulatoryContent && (
        <Alert className="mx-4 mt-2 bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800">
          <Info className="h-4 w-4 text-blue-500 dark:text-blue-400" />
          <AlertDescription className="text-sm text-blue-700 dark:text-blue-300">
            Using regulatory data from {regulatoryContext.sourceDocuments?.length || 0} sources
            {regulatoryContext.relevanceScore !== undefined && 
              ` (Relevance: ${Math.round(regulatoryContext.relevanceScore * 100)}%)`
            }
          </AlertDescription>
        </Alert>
      )}
      
      <ChatHistory 
        messages={messages} 
        isLoading={isLoading} 
        onRetry={onRetry}
        translatingMessageIds={translatingMessageIds}
      />
    </CardContent>
  );
};

export default ChatContent;
