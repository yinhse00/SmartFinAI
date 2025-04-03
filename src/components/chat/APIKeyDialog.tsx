
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

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
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Enter Grok API Key</DialogTitle>
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
              placeholder="Enter your Grok API key"
              value={grokApiKeyInput}
              onChange={(e) => setGrokApiKeyInput(e.target.value)}
            />
          </div>
          
          <p className="text-xs text-gray-500">
            Your API key is stored only in your browser's local storage. We do not store it on our servers.
          </p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={onSave}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default APIKeyDialog;
