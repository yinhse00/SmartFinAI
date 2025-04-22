
import { useState, useEffect } from 'react';
import { grokApiService } from '@/services/api/grokApiService';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertCircle, CheckCircle, RefreshCw } from 'lucide-react';

interface ApiConnectionStatusProps {
  onOpenApiKeyDialog: () => void;
}

const ApiConnectionStatus = ({ onOpenApiKeyDialog }: ApiConnectionStatusProps) => {
  const [connectionStatus, setConnectionStatus] = useState<{
    success: boolean | null;
    message: string;
    loading: boolean;
  }>({
    success: null,
    message: 'Checking API connection...',
    loading: true
  });

  const checkConnection = async () => {
    setConnectionStatus({
      success: null,
      message: 'Checking API connection...',
      loading: true
    });
    
    try {
      const result = await grokApiService.testApiConnection();
      setConnectionStatus({
        success: result.success,
        message: result.message,
        loading: false
      });
    } catch (error) {
      setConnectionStatus({
        success: false,
        message: error instanceof Error ? error.message : 'Unknown connection error',
        loading: false
      });
    }
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
