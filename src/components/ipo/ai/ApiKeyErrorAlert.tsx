import React from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertCircle, ExternalLink, RefreshCcw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface ApiKeyErrorAlertProps {
  error: string;
  onRetry?: () => void;
}

export const ApiKeyErrorAlert: React.FC<ApiKeyErrorAlertProps> = ({ error, onRetry }) => {
  const navigate = useNavigate();

  // Check error type
  const isGrokDisabled = error.includes('Grok') || error.includes('disabled') || error.includes('403');
  const isRateLimit = error.includes('Rate limit') || error.includes('429') || error.includes('Resource exhausted');
  
  if (isGrokDisabled) {
    return (
      <Alert variant="destructive" className="mb-4">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>⚠️ Grok API Key Disabled</AlertTitle>
        <AlertDescription className="space-y-3">
          <p>Your Grok API key has been disabled and needs to be re-enabled.</p>
          
          <div className="bg-destructive/10 p-3 rounded-md space-y-2">
            <p className="font-medium text-sm">Quick Fix Steps:</p>
            <ol className="list-decimal list-inside space-y-1 text-sm">
              <li>Go to <a href="https://console.x.ai" target="_blank" rel="noopener noreferrer" className="underline inline-flex items-center gap-1">
                console.x.ai <ExternalLink className="h-3 w-3" />
              </a></li>
              <li>Navigate to API Keys section</li>
              <li>Find your disabled key and click "Enable"</li>
              <li>Or create a new API key</li>
            </ol>
          </div>

          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/profile')}
              className="text-xs"
            >
              Update API Key in Profile
            </Button>
            {onRetry && (
              <Button
                variant="outline"
                size="sm"
                onClick={onRetry}
                className="text-xs"
              >
                <RefreshCcw className="h-3 w-3 mr-1" />
                Retry
              </Button>
            )}
          </div>
        </AlertDescription>
      </Alert>
    );
  }

  if (isRateLimit) {
    return (
      <Alert variant="destructive" className="mb-4">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>⏳ Rate Limit Exceeded</AlertTitle>
        <AlertDescription className="space-y-3">
          <p>Google API quota has been exhausted due to high request volume.</p>
          
          <div className="bg-destructive/10 p-3 rounded-md space-y-2">
            <p className="font-medium text-sm">Why this happens:</p>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>Your Grok API key is disabled (see above)</li>
              <li>System falls back to Google API</li>
              <li>Too many requests exhaust Google's quota</li>
            </ul>
          </div>

          <div className="bg-amber-50 dark:bg-amber-950/20 p-3 rounded-md border border-amber-200 dark:border-amber-800">
            <p className="font-medium text-sm text-amber-800 dark:text-amber-200">Solution:</p>
            <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
              Re-enable your Grok API key at console.x.ai, or wait 1-2 minutes and try again.
            </p>
          </div>

          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open('https://console.x.ai', '_blank')}
              className="text-xs"
            >
              <ExternalLink className="h-3 w-3 mr-1" />
              Open console.x.ai
            </Button>
            {onRetry && (
              <Button
                variant="outline"
                size="sm"
                onClick={onRetry}
                disabled
                className="text-xs"
              >
                <RefreshCcw className="h-3 w-3 mr-1" />
                Retry in 60s
              </Button>
            )}
          </div>
        </AlertDescription>
      </Alert>
    );
  }

  // Generic error
  return (
    <Alert variant="destructive" className="mb-4">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>AI Service Error</AlertTitle>
      <AlertDescription className="space-y-2">
        <p>{error}</p>
        {onRetry && (
          <Button
            variant="outline"
            size="sm"
            onClick={onRetry}
            className="text-xs"
          >
            <RefreshCcw className="h-3 w-3 mr-1" />
            Try Again
          </Button>
        )}
      </AlertDescription>
    </Alert>
  );
};
