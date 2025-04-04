
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ExternalLink, AlertCircle, Info } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface APIKeyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  grokApiKeyInput: string;
  setGrokApiKeyInput: (key: string) => void;
  onSave: () => void;
}

const APIKeyDialog: React.FC<APIKeyDialogProps> = ({
  open,
  onOpenChange,
  grokApiKeyInput,
  setGrokApiKeyInput,
  onSave
}) => {
  const [keyError, setKeyError] = useState<string | null>(null);
  
  const validateAndSave = () => {
    // Basic validation for Grok API key format
    if (!grokApiKeyInput.startsWith('xai-')) {
      setKeyError("Invalid API key format. Grok API keys should start with 'xai-'");
      return;
    }
    
    setKeyError(null);
    onSave();
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Enter Grok API Key</DialogTitle>
          <DialogDescription>
            You need a Grok API key to connect to the service. Enter it below to proceed.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="grok-apikey">
              Grok API Key
              <span className="text-xs text-gray-500 ml-2">
                (Stored in your browser)
              </span>
            </Label>
            <Input
              id="grok-apikey"
              type="password"
              placeholder="Enter your Grok API key (starts with xai-)"
              value={grokApiKeyInput}
              onChange={(e) => {
                setGrokApiKeyInput(e.target.value);
                setKeyError(null); // Clear error on input change
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && grokApiKeyInput.trim()) {
                  validateAndSave();
                }
              }}
              className={keyError ? "border-red-500" : ""}
            />
            
            {keyError && (
              <Alert variant="destructive" className="mt-2">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{keyError}</AlertDescription>
              </Alert>
            )}
          </div>
          
          <Alert variant="default" className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
            <Info className="h-4 w-4 text-blue-500" />
            <AlertDescription className="text-blue-800 dark:text-blue-300">
              Your API key is stored only in your browser's local storage. We do not store it on our servers.
            </AlertDescription>
          </Alert>
          
          <div className="text-xs flex items-center gap-1 mt-2">
            <span>Get your API key from</span>
            <a 
              href="https://x.ai/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-finance-medium-blue dark:text-finance-accent-blue flex items-center gap-0.5 hover:underline"
            >
              Grok AI <ExternalLink size={10} />
            </a>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={validateAndSave}
            disabled={!grokApiKeyInput.trim()}
          >
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default APIKeyDialog;
