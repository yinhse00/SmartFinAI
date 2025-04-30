
import React from 'react';
import { CardHeader } from '@/components/ui/card';
import { Settings, WifiOff, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface ChatHeaderProps {
  isGrokApiKeySet: boolean;
  onOpenApiKeyDialog: () => void;
  isOfflineMode?: boolean;
  onTryReconnect?: () => void;
}

const ChatHeader: React.FC<ChatHeaderProps> = ({
  isGrokApiKeySet,
  onOpenApiKeyDialog,
  isOfflineMode = false,
  onTryReconnect
}) => {
  return (
    <CardHeader className="border-b px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold">SmartFinAI Chat</h2>
          {isOfflineMode ? (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-300 flex items-center gap-1">
                    <WifiOff className="h-3 w-3" />
                    Offline Mode
                  </Badge>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p>
                    Operating in offline mode with limited functionality. The Grok API is currently unreachable due to CORS or network issues.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ) : (
            <Badge variant="outline" className="bg-green-50 text-green-600 border-green-300 flex items-center gap-1">
              Connected
            </Badge>
          )}
          {!isGrokApiKeySet && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge variant="outline" className="bg-red-50 text-red-600 border-red-300 flex items-center gap-1">
                    <Info className="h-3 w-3" />
                    API Key Required
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Set your Grok API key to enable full functionality</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          {isOfflineMode && onTryReconnect && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={onTryReconnect}
              className="h-8 text-xs"
            >
              Try Reconnect
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={onOpenApiKeyDialog}
            className="h-8 flex items-center gap-1 text-xs"
          >
            <Settings className="h-3 w-3" />
            API Settings
          </Button>
        </div>
      </div>
    </CardHeader>
  );
};

export default ChatHeader;
