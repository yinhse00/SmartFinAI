
import { Button } from '@/components/ui/button';
import { AlertCircle, Check, RefreshCw } from 'lucide-react';

interface ApiConnectionStatusProps {
  onOpenApiKeyDialog: () => void;
  isOfflineMode: boolean;
  onTryReconnect: () => void;
}

const ApiConnectionStatus = ({ 
  onOpenApiKeyDialog, 
  isOfflineMode,
  onTryReconnect
}: ApiConnectionStatusProps) => {
  return (
    <div className="flex items-center justify-end mb-4">
      {isOfflineMode ? (
        // Simplified offline status
        <div className="flex items-center gap-2">
          <span className="text-xs text-red-500 flex items-center gap-1">
            <AlertCircle className="h-3 w-3" />
            Offline Mode
          </span>
          <Button 
            variant="secondary" 
            size="sm" 
            className="h-7 text-xs px-2"
            onClick={onTryReconnect}
          >
            <RefreshCw className="h-3 w-3 mr-1" />
            Retry Connection
          </Button>
        </div>
      ) : (
        // Simplified online status
        <div className="flex items-center gap-2">
          <span className="text-xs text-green-500 flex items-center gap-1">
            <Check className="h-3 w-3" />
            Online
          </span>
          <Button 
            variant="secondary" 
            size="sm" 
            className="h-7 text-xs px-2"
            onClick={onOpenApiKeyDialog}
          >
            Update API Key
          </Button>
        </div>
      )}
    </div>
  );
};

export default ApiConnectionStatus;
