
import React from 'react';
import { Button } from '@/components/ui/button';
import { ShieldAlert, ShieldCheck, KeyRound, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ApiConnectionStatusProps {
  onOpenApiKeyDialog: () => void;
  isOfflineMode?: boolean;
  onTryReconnect?: () => Promise<boolean>;
  isApiKeyRotating?: boolean;
}

const ApiConnectionStatus: React.FC<ApiConnectionStatusProps> = ({ 
  onOpenApiKeyDialog, 
  isOfflineMode = false,
  onTryReconnect,
  isApiKeyRotating = false
}) => {
  const handleReconnect = async () => {
    if (onTryReconnect) {
      await onTryReconnect();
    }
  };

  return (
    <div className="mb-4">
      <div className="bg-white border rounded-lg p-3 shadow-sm">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            {isOfflineMode ? (
              <ShieldAlert className="h-5 w-5 text-red-500" />
            ) : (
              <ShieldCheck className="h-5 w-5 text-green-500" />
            )}
            
            <div>
              <h3 className="font-medium text-sm">
                API Connection: <span className={cn(
                  "font-semibold",
                  isOfflineMode ? "text-red-500" : "text-green-500"
                )}>
                  {isOfflineMode ? "Offline" : "Connected"}
                </span>
                
                {isApiKeyRotating && (
                  <span className="ml-2 inline-flex items-center text-blue-500 text-xs">
                    <KeyRound size={12} className="mr-1 animate-pulse" />
                    Rotating Keys
                  </span>
                )}
              </h3>
              
              <p className="text-xs text-gray-500">
                {isOfflineMode 
                  ? "Using offline mode with limited capabilities. Set API key to enable all features."
                  : "Connected to Grok financial expert API with all features enabled."
                }
              </p>
            </div>
          </div>
          
          <div className="flex gap-2">
            {isOfflineMode && onTryReconnect && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleReconnect}
                className="text-xs flex items-center gap-1"
              >
                <RefreshCw size={12} />
                Retry
              </Button>
            )}
            
            <Button 
              variant={isOfflineMode ? "default" : "outline"} 
              size="sm"
              onClick={onOpenApiKeyDialog}
              className="text-xs"
            >
              {isOfflineMode ? "Set API Key" : "Change API Key"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApiConnectionStatus;
