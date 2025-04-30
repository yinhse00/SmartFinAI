
import React from 'react';
import { CardHeader } from '@/components/ui/card';
import { BookOpen, Settings, WifiOff } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ChatHeaderProps {
  isGrokApiKeySet: boolean;
  onOpenApiKeyDialog: () => void;
  isOfflineMode?: boolean; // New prop for offline mode
}

const ChatHeader: React.FC<ChatHeaderProps> = ({ 
  isGrokApiKeySet, 
  onOpenApiKeyDialog,
  isOfflineMode = false 
}) => {
  return (
    <CardHeader className="border-b px-4 py-3 flex flex-row justify-between items-center space-y-0">
      <div className="flex items-center gap-2">
        <BookOpen className="h-5 w-5 text-finance-medium-blue" />
        <h3 className="font-semibold text-lg">
          SmartFinAI {isOfflineMode && (
            <span className="inline-flex items-center gap-1 text-amber-500 text-sm font-normal ml-2">
              <WifiOff size={14} />
              Offline Mode
            </span>
          )}
        </h3>
      </div>
      <Button
        variant="outline"
        size="sm"
        className="h-8 gap-1"
        onClick={onOpenApiKeyDialog}
      >
        <Settings className="h-3.5 w-3.5" />
        <span>{isGrokApiKeySet ? 'API Settings' : 'Set API Key'}</span>
      </Button>
    </CardHeader>
  );
};

export default ChatHeader;
