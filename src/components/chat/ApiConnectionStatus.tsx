
import { useState, useEffect } from 'react';
import { grokApiService } from '@/services/api/grokApiService';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertCircle, CheckCircle, RefreshCw, Wifi, WifiOff } from 'lucide-react';

interface ApiConnectionStatusProps {
  onOpenApiKeyDialog: () => void;
}

const ApiConnectionStatus = ({ onOpenApiKeyDialog }: ApiConnectionStatusProps) => {
  const [connectionStatus, setConnectionStatus] = useState<{
    success: boolean | null;
    message: string;
    loading: boolean;
    isOfflineMode: boolean;
  }>({
    success: null,
    message: 'Checking API connection...',
    loading: true,
    isOfflineMode: false
  });

  const checkConnection = async () => {
    setConnectionStatus({
      success: null,
      message: 'Checking API connection...',
      loading: true,
      isOfflineMode: false
    });
    
    try {
      const result = await grokApiService.testApiConnection();
      setConnectionStatus({
        success: result.success,
        message: result.message,
        loading: false,
        isOfflineMode: false
      });
    } catch (error) {
      // Check if this is a network error (likely CORS or connectivity issue)
      const isNetworkError = error instanceof Error && 
        (error.message.includes('Failed to fetch') || 
         error.message.includes('NetworkError') ||
         error.message.includes('Network request failed'));
      
      setConnectionStatus({
        success: false,
        message: isNetworkError 
          ? 'Network connectivity issue. The API may be unreachable due to CORS restrictions or network configuration.'
          : error instanceof Error ? error.message : 'Unknown connection error',
        loading: false,
        isOfflineMode: isNetworkError
      });
    }
  };

  const enableOfflineMode = () => {
    setConnectionStatus({
      success: null,
      message: 'Using offline mode with local fallback responses.',
      loading: false,
      isOfflineMode: true
    });
  };

  useEffect(() => {
    checkConnection();
  }, []);

  return (
    <div className="mb-4">
      {connectionStatus.loading ? (
        <Alert className="bg-finance-light-blue/10 border-finance-light-blue">
          <RefreshCw className="h-4 w-4 animate-spin text-finance-medium-blue" />
          <AlertTitle>Testing API Connection</AlertTitle>
          <AlertDescription>Please wait while we verify the connection...</AlertDescription>
        </Alert>
      ) : connectionStatus.success ? (
        <Alert className="bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-800">
          <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
          <AlertTitle>API Connected</AlertTitle>
          <AlertDescription className="flex items-center justify-between">
            <span>SmartFinAI is ready to answer your queries.</span>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={checkConnection}
              className="h-7 gap-1 text-xs"
            >
              <RefreshCw className="h-3 w-3" />
              Recheck
            </Button>
          </AlertDescription>
        </Alert>
      ) : connectionStatus.isOfflineMode ? (
        <Alert className="bg-amber-50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-800">
          <WifiOff className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          <AlertTitle>Offline Mode</AlertTitle>
          <AlertDescription className="flex flex-col space-y-2">
            <span>Operating in offline mode with limited functionality.</span>
            <div className="flex gap-2 mt-1">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={checkConnection}
                className="h-7 gap-1 text-xs"
              >
                <Wifi className="h-3 w-3" />
                Try Reconnect
              </Button>
              <Button 
                variant="default"
                size="sm"
                onClick={onOpenApiKeyDialog}
                className="h-7 text-xs bg-finance-dark-blue hover:bg-finance-dark-blue/90"
              >
                Update API Key
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      ) : (
        <Alert className="bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-800">
          <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
          <AlertTitle>API Connection Issue</AlertTitle>
          <AlertDescription className="flex flex-col space-y-2">
            <span>{connectionStatus.message}</span>
            <div className="flex gap-2 mt-1">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={checkConnection}
                className="h-7 gap-1 text-xs"
              >
                <RefreshCw className="h-3 w-3" />
                Retry
              </Button>
              <Button 
                variant="outline"
                size="sm"
                onClick={enableOfflineMode}
                className="h-7 gap-1 text-xs"
              >
                <WifiOff className="h-3 w-3" />
                Use Offline Mode
              </Button>
              <Button 
                variant="default"
                size="sm"
                onClick={onOpenApiKeyDialog}
                className="h-7 text-xs bg-finance-dark-blue hover:bg-finance-dark-blue/90"
              >
                Update API Key
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default ApiConnectionStatus;
