
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
    <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4 bg-white dark:bg-gray-950 border-b">
      <div className="flex items-center">
        <BookOpen className="mr-2 h-5 w-5 text-finance-medium-blue" />
        <div>
          <h3 className="font-semibold leading-none tracking-tight text-gray-900 dark:text-gray-100">SmartFinAI</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {isOfflineMode ? (
              <span className="flex items-center text-amber-600 dark:text-amber-400">
                <WifiOff className="inline-block h-3 w-3 mr-1" />
                离线模式 / Offline Mode
              </span>
            ) : (
              "金融监管智能助手 / Financial Regulatory Assistant"
            )}
          </p>
        </div>
      </div>
      
      {!isGrokApiKeySet && (
        <Button 
          variant="outline" 
          size="sm" 
          className="flex items-center gap-1"
          onClick={onOpenApiKeyDialog}
        >
          <Settings className="h-4 w-4 text-gray-500" />
          <span>Set API Key</span>
        </Button>
      )}
    </CardHeader>
  );
};

export default ChatHeader;
