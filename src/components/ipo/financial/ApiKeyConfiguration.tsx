import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Eye, EyeOff, Key, AlertCircle, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { hasGrokApiKey, setGrokApiKey } from '@/services/apiKeyService';

interface ApiKeyConfigurationProps {
  onKeyConfigured?: () => void;
}

export const ApiKeyConfiguration: React.FC<ApiKeyConfigurationProps> = ({
  onKeyConfigured
}) => {
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [hasValidKey, setHasValidKey] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Check if API key is already configured
    setHasValidKey(hasGrokApiKey());
  }, []);

  const validateApiKey = (key: string): boolean => {
    return typeof key === 'string' && key.startsWith('xai-') && key.length >= 20;
  };

  const handleSaveApiKey = async () => {
    if (!validateApiKey(apiKey)) {
      toast({
        title: "Invalid API Key",
        description: "Please enter a valid X.AI API key (starts with 'xai-')",
        variant: "destructive"
      });
      return;
    }

    setIsValidating(true);
    
    try {
      setGrokApiKey(apiKey);
      setHasValidKey(true);
      setApiKey(''); // Clear the input for security
      
      toast({
        title: "API Key Configured",
        description: "X.AI API key has been successfully saved. AI-powered financial analysis is now available.",
      });

      onKeyConfigured?.();
    } catch (error) {
      toast({
        title: "Configuration Error",
        description: "Failed to save API key. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsValidating(false);
    }
  };

  const handleKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setApiKey(e.target.value);
  };

  if (hasValidKey) {
    return (
      <Alert>
        <CheckCircle className="h-4 w-4" />
        <AlertDescription>
          X.AI API key is configured. AI-powered financial table recognition is active.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Key className="w-5 h-5" />
          AI Configuration Required
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            To enable AI-powered financial table recognition and accurate P&L/Balance Sheet analysis, 
            please configure your X.AI API key.
          </AlertDescription>
        </Alert>

        <div className="space-y-2">
          <Label htmlFor="api-key">X.AI API Key</Label>
          <div className="relative">
            <Input
              id="api-key"
              type={showKey ? "text" : "password"}
              placeholder="xai-..."
              value={apiKey}
              onChange={handleKeyChange}
              className="pr-10"
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
              onClick={() => setShowKey(!showKey)}
            >
              {showKey ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        <Button 
          onClick={handleSaveApiKey}
          disabled={!apiKey || isValidating}
          className="w-full"
        >
          {isValidating ? 'Configuring...' : 'Save API Key'}
        </Button>

        <div className="text-xs text-muted-foreground space-y-1">
          <p>• Get your API key from <a href="https://console.x.ai" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">console.x.ai</a></p>
          <p>• Your API key is stored securely in your browser</p>
          <p>• Required for AI-powered table recognition and materiality analysis</p>
        </div>
      </CardContent>
    </Card>
  );
};