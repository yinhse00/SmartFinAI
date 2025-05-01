
import { useState, useEffect } from 'react';
import { grokApiService } from '@/services/api/grokApiService';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertCircle, CheckCircle, RefreshCw, Wifi, WifiOff } from 'lucide-react';
import { clearConnectionCache } from '@/services/api/grok/modules/endpointManager';
import { useToast } from '@/hooks/use-toast';

interface ApiConnectionStatusProps {
  onOpenApiKeyDialog: () => void;
  isOfflineMode?: boolean; // New prop to indicate offline mode
  onTryReconnect?: () => Promise<boolean>; // New callback for reconnection attempts
}

const ApiConnectionStatus = ({ 
  onOpenApiKeyDialog, 
  isOfflineMode: externalOfflineMode, // Provided from parent
  onTryReconnect 
}: ApiConnectionStatusProps) => {
  const [connectionStatus, setConnectionStatus] = useState<{
    success: boolean | null;
    message: string;
    loading: boolean;
    isOfflineMode: boolean;
    lastCheckTime: number;
  }>({
    success: null,
    message: 'Checking AI connection...',
    loading: true,
    isOfflineMode: false,
    lastCheckTime: 0
  });
  
  const { toast } = useToast();

  // Force a fresh connection check when specifically requested
  const forceConnectionCheck = async () => {
    // First clear any cached connection information
    clearConnectionCache();
    
    setConnectionStatus(prev => ({
      ...prev,
      loading: true,
      message: 'Performing forceful connection check...',
      lastCheckTime: Date.now()
    }));
    
    try {
      // Wait a moment to ensure any previous connections are fully closed
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // If external reconnect handler is provided, use it
      if (onTryReconnect) {
        const success = await onTryReconnect();
        
        setConnectionStatus({
          success,
          message: success 
            ? 'AI connection restored successfully!' 
            : 'AI is still unreachable. Please check your internet connection and API key.',
          loading: false,
          isOfflineMode: !success,
          lastCheckTime: Date.now()
        });
        
        if (success) {
          toast({
            title: "Connection Restored",
            description: "Successfully reconnected to the AI service."
          });
        }
        
        return;
      }
      
      // Fallback to regular connection check - Fixed here: removed the second argument
      const result = await grokApiService.testApiConnection();
      
      setConnectionStatus({
        success: result.success,
        message: result.message,
        loading: false,
        isOfflineMode: !result.success,
        lastCheckTime: Date.now()
      });
      
      if (result.success) {
        toast({
          title: "Connection Restored",
          description: "Successfully reconnected to the AI service."
        });
      }
    } catch (error) {
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
        isOfflineMode: isNetworkError,
        lastCheckTime: Date.now()
      });
    }
  };

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
          : 'AI connection is active.',
        lastCheckTime: Date.now()
      }));
    }
  }, [externalOfflineMode]);

  const checkConnection = async () => {
    // If less than 5 seconds since last check, don't check again
    const now = Date.now();
    if (now - connectionStatus.lastCheckTime < 5000 && !connectionStatus.loading) {
      toast({
        title: "Please wait",
        description: "Connection check was performed recently. Try again in a few seconds."
      });
      return;
    }
    
    // If external reconnect handler is provided, use it
    if (onTryReconnect) {
      setConnectionStatus(prev => ({
        ...prev,
        loading: true,
        message: 'Checking AI connection...',
        lastCheckTime: now
      }));
      
      const success = await onTryReconnect();
      
      setConnectionStatus({
        success,
        message: success 
          ? 'AI connection restored successfully.' 
          : 'AI is still unreachable. Please check your internet connection and API key.',
        loading: false,
        isOfflineMode: !success,
        lastCheckTime: now
      });
      
      return;
    }
    
    // Fallback to original implementation
    setConnectionStatus({
      success: null,
      message: 'Checking AI connection...',
      loading: true,
      isOfflineMode: false,
      lastCheckTime: now
    });
    
    try {
      const result = await grokApiService.testApiConnection();
      setConnectionStatus({
        success: result.success,
        message: result.message,
        loading: false,
        isOfflineMode: !result.success,
        lastCheckTime: now
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
        isOfflineMode: isNetworkError,
        lastCheckTime: now
      });
    }
  };

  const enableOfflineMode = () => {
    setConnectionStatus({
      success: null,
      message: 'Using offline mode with local fallback responses.',
      loading: false,
      isOfflineMode: true,
      lastCheckTime: Date.now()
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
        <Alert className="bg-finance-light-blue/10 border-finance-light-blue">
          <RefreshCw className="h-4 w-4 animate-spin text-finance-medium-blue" />
          <AlertTitle>Testing AI Connection</AlertTitle>
          <AlertDescription>Please wait while we verify the connection...</AlertDescription>
        </Alert>
      ) : connectionStatus.success ? (
        <Alert className="bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-800">
          <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
          <AlertTitle>AI Connected</AlertTitle>
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
                onClick={forceConnectionCheck}
                className="h-7 gap-1 text-xs"
              >
                <Wifi className="h-3 w-3" />
                Force Reconnect
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
          <AlertTitle>AI Connection Issue</AlertTitle>
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
                onClick={forceConnectionCheck}
                className="h-7 gap-1 text-xs bg-blue-50"
              >
                <Wifi className="h-3 w-3" />
                Force Reconnect
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
