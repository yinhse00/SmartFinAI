
import React from 'react';
import { CardHeader } from '@/components/ui/card';
import { Settings, WifiOff } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ChatHeaderProps {
  isGrokApiKeySet: boolean;
  onOpenApiKeyDialog: () => void;
  isOfflineMode?: boolean;
}

const ChatHeader: React.FC<ChatHeaderProps> = ({ 
  isGrokApiKeySet, 
  onOpenApiKeyDialog,
  isOfflineMode = false 
}) => {
  return (
    <CardHeader className="border-b px-4 py-2 flex flex-row justify-end items-center space-y-0">
      <div className="flex items-center gap-2 ml-auto">
        {isOfflineMode && (
          <span className="inline-flex items-center gap-1 text-amber-500 text-sm font-normal mr-2">
            <WifiOff size={14} />
            <span className="hidden sm:inline">Offline Mode</span>
          </span>
        )}
        <Button
          variant="outline"
          size="sm"
          className="h-8 gap-1"
          onClick={onOpenApiKeyDialog}
        >
          <Settings className="h-3.5 w-3.5" />
          <span>{isGrokApiKeySet ? 'API Settings' : 'Set API Key'}</span>
        </Button>
      </div>
    </CardHeader>
  );
};

export default ChatHeader;
