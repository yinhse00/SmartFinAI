
import React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Send, Loader2, AlertTriangle, WifiOff } from 'lucide-react';
import UnifiedUploadButton from './upload/UnifiedUploadButton';
import AttachedFilesList from './upload/AttachedFilesList';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface ChatInputProps {
  input: string;
  setInput: (input: string) => void;
  handleSend: () => void;
  isLoading: boolean;
  isGrokApiKeySet: boolean;
  onOpenApiKeyDialog: () => void;
  handleKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onFileSelect?: (files: FileList) => void;
  placeholder?: string;
  isProcessingFiles?: boolean;
  attachedFiles?: File[];
  onFileRemove?: (index: number) => void;
  isOfflineMode?: boolean; // New prop to indicate offline mode
}

const ChatInput: React.FC<ChatInputProps> = ({
  input,
  setInput,
  handleSend,
  isLoading,
  handleKeyDown,
  onFileSelect,
  placeholder = "Ask about HK listing rules, takeovers, or compliance requirements...",
  isProcessingFiles = false,
  attachedFiles = [],
  onFileRemove,
  isOfflineMode = false // Default to false
}) => {
  const hasAttachedFiles = attachedFiles.length > 0;
  
  return (
    <div className="p-4 border-t">
      {isOfflineMode && hasAttachedFiles && (
        <Alert className="mb-4 bg-amber-50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-800">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-800 dark:text-amber-400 text-sm">
            <div className="flex items-center gap-1">
              <WifiOff size={14} />
              <span>Operating in offline mode. File processing will be limited.</span>
            </div>
          </AlertDescription>
        </Alert>
      )}
      
      {hasAttachedFiles && onFileRemove && (
        <AttachedFilesList 
          files={attachedFiles}
          onRemove={onFileRemove}
          isOfflineMode={isOfflineMode}
        />
      )}
      <div className="flex gap-2 items-center">
        {onFileSelect && (
          <UnifiedUploadButton 
            onFileSelect={onFileSelect} 
            isProcessing={isProcessingFiles}
            isOfflineMode={isOfflineMode}
          />
        )}
        <Input
          className="flex-1 bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700"
          placeholder={hasAttachedFiles ? "Type your question about the attached files..." : placeholder}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isLoading || isProcessingFiles}
        />
        <Button 
          onClick={handleSend} 
          className="bg-finance-medium-blue hover:bg-finance-dark-blue"
          disabled={(hasAttachedFiles ? false : !input.trim()) || isLoading || isProcessingFiles}
        >
          {isLoading || isProcessingFiles ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send size={18} />}
        </Button>
      </div>
    </div>
  );
};

export default ChatInput;
