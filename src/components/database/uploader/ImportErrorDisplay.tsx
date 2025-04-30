
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ImportErrorDisplayProps {
  error: string | null;
  onRetry?: () => void;
}

const ImportErrorDisplay = ({ error, onRetry }: ImportErrorDisplayProps) => {
  if (!error) return null;
  
  // Check if this is a CORS-related error
  const isCorsError = error.includes('CORS') || 
                     error.includes('Failed to fetch') || 
                     error.includes('Network Error');
  
  return (
    <Alert variant="destructive" className="mb-4">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>
        {isCorsError ? "API Connection Issue" : "Import Error"}
      </AlertTitle>
      <AlertDescription className="mt-2">
        <div className="space-y-2">
          <p>{error}</p>
          
          {isCorsError && (
            <div className="text-sm mt-2 space-y-2">
              <p>This appears to be a CORS or network connectivity issue. The API for processing documents may be unreachable.</p>
              
              <p>For optimal document processing:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Check your internet connection</li>
                <li>Ensure the API proxy is correctly configured in vite.config.ts</li>
                <li>Try with a smaller document if the current one is very large</li>
              </ul>
              
              {onRetry && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={onRetry} 
                  className="mt-2"
                >
                  Try Again
                </Button>
              )}
            </div>
          )}
        </div>
      </AlertDescription>
    </Alert>
  );
};

export default ImportErrorDisplay;
