
import { useState, useEffect } from 'react';
import { grokApiService } from '@/services/api/grokApiService';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertCircle, CheckCircle, RefreshCw, Wifi, WifiOff, Settings } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface ApiConnectionStatusProps {
  onOpenApiKeyDialog: () => void;
  isOfflineMode?: boolean;
  onTryReconnect?: () => Promise<boolean>;
}

const ApiConnectionStatus = ({ 
  onOpenApiKeyDialog, 
  isOfflineMode: externalOfflineMode,
  onTryReconnect 
}: ApiConnectionStatusProps) => {
  const [connectionStatus, setConnectionStatus] = useState<{
    success: boolean | null;
    message: string;
    loading: boolean;
    isOfflineMode: boolean;
  }>({
    success: null,
    message: 'Checking AI connection...',
    loading: true,
    isOfflineMode: false
  });

  // Update internal state when external offline mode changes
  useEffect(() => {
    if (externalOfflineMode !== undefined) {
      setConnectionStatus(prev => ({
        ...prev,
        success: !externalOfflineMode,
        isOfflineMode: externalOfflineMode,
        loading: false,
        message: externalOfflineMode 
          ? 'AI is unreachable. Operating in offline mode with limited functionality.' 
          : 'AI connection is active.'
      }));
    }
  }, [externalOfflineMode]);

  const checkConnection = async () => {
    // If external reconnect handler is provided, use it
    if (onTryReconnect) {
      setConnectionStatus(prev => ({
        ...prev,
        loading: true,
        message: 'Checking AI connection...'
      }));
      
      const success = await onTryReconnect();
      
      setConnectionStatus({
        success,
        message: success 
          ? 'AI connection restored successfully.' 
          : 'AI is still unreachable. Please check your internet connection and API key.',
        loading: false,
        isOfflineMode: !success
      });
      
      return;
    }
    
    // Fallback to original implementation
    setConnectionStatus({
      success: null,
      message: 'Checking AI connection...',
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
          ? 'Network connectivity issue. The AI may be unreachable due to CORS restrictions or network configuration.'
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
    // Only check connection if external offline mode is not provided
    if (externalOfflineMode === undefined) {
      checkConnection();
    }
  }, [externalOfflineMode]);

  return (
    <div className="mb-4">
      {connectionStatus.loading ? (
        <Alert className="bg-finance-light-blue/10 border-finance-light-blue shadow-sm">
          <div className="flex items-center">
            <RefreshCw className="h-4 w-4 animate-spin text-finance-medium-blue mr-2" />
            <div>
              <AlertTitle className="text-sm font-medium">Testing AI Connection</AlertTitle>
              <AlertDescription className="text-xs">Please wait while we verify the connection...</AlertDescription>
            </div>
          </div>
        </Alert>
      ) : connectionStatus.success ? (
        <Alert className="bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-800 shadow-sm">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center">
              <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400 mr-2" />
              <div>
                <AlertTitle className="text-sm font-medium flex items-center">
                  AI Connected <Badge variant="outline" className="ml-2 text-xs bg-green-50 text-green-600 border-green-300">v2.0</Badge>
                </AlertTitle>
                <AlertDescription className="text-xs">SmartFinAI is ready to answer your queries.</AlertDescription>
              </div>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={checkConnection}
              className="h-7 gap-1 text-xs"
            >
              <RefreshCw className="h-3 w-3" />
              Recheck
            </Button>
          </div>
        </Alert>
      ) : connectionStatus.isOfflineMode ? (
        <Alert className="bg-amber-50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-800 shadow-sm">
          <div className="flex flex-col space-y-2 w-full">
            <div className="flex items-center">
              <WifiOff className="h-4 w-4 text-amber-600 dark:text-amber-400 mr-2" />
              <div>
                <AlertTitle className="text-sm font-medium flex items-center">
                  Offline Mode <Badge variant="outline" className="ml-2 text-xs bg-amber-50 text-amber-600 border-amber-300">Limited</Badge>
                </AlertTitle>
                <AlertDescription className="text-xs">Operating with limited functionality.</AlertDescription>
              </div>
            </div>
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
                className="h-7 text-xs bg-finance-dark-blue hover:bg-finance-dark-blue/90 gap-1"
              >
                <Settings className="h-3 w-3" />
                Update API Key
              </Button>
            </div>
          </div>
        </Alert>
      ) : (
        <Alert className="bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-800 shadow-sm">
          <div className="flex flex-col space-y-2 w-full">
            <div className="flex items-center">
              <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400 mr-2" />
              <div>
                <AlertTitle className="text-sm font-medium">AI Connection Issue</AlertTitle>
                <AlertDescription className="text-xs">{connectionStatus.message}</AlertDescription>
              </div>
            </div>
            <div className="flex gap-2 mt-1 flex-wrap">
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
                Use Offline
              </Button>
              <Button 
                variant="default"
                size="sm"
                onClick={onOpenApiKeyDialog}
                className="h-7 text-xs bg-finance-dark-blue hover:bg-finance-dark-blue/90 gap-1"
              >
                <Settings className="h-3 w-3" />
                Update API Key
              </Button>
            </div>
          </div>
        </Alert>
      )}
    </div>
  );
};

export default ApiConnectionStatus;
