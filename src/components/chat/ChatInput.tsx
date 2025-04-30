
import React, { useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Send, Loader2, AlertTriangle, WifiOff } from 'lucide-react';
import UnifiedUploadButton from './upload/UnifiedUploadButton';
import AttachedFilesList from './upload/AttachedFilesList';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';

interface ChatInputProps {
  input: string;
  setInput: (input: string) => void;
  handleSend: () => void;
  isLoading: boolean;
  isGrokApiKeySet: boolean;
  onOpenApiKeyDialog: () => void;
  handleKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  onFileSelect?: (files: FileList) => void;
  placeholder?: string;
  isProcessingFiles?: boolean;
  attachedFiles?: File[];
  onFileRemove?: (index: number) => void;
  isOfflineMode?: boolean;
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
  isOfflineMode = false
}) => {
  const hasAttachedFiles = attachedFiles.length > 0;
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  // Auto-resize textarea based on content
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const scrollHeight = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = `${Math.min(scrollHeight, 150)}px`;
    }
  }, [input]);

  // Handle textarea changes
  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
  };
  
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
      
      <div className="flex gap-2 items-start">
        {onFileSelect && (
          <UnifiedUploadButton 
            onFileSelect={onFileSelect} 
            isProcessing={isProcessingFiles}
            isOfflineMode={isOfflineMode}
          />
        )}
        
        <div className="flex-1 relative">
          <Textarea
            ref={textareaRef}
            className="min-h-[60px] max-h-[150px] bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700 pr-12 py-3"
            placeholder={hasAttachedFiles ? "Type your question about the attached files..." : placeholder}
            value={input}
            onChange={handleTextareaChange}
            onKeyDown={handleKeyDown}
            disabled={isLoading || isProcessingFiles}
            rows={2}
          />
          <Button 
            onClick={handleSend} 
            className="absolute right-2 bottom-2 bg-finance-medium-blue hover:bg-finance-dark-blue size-8 p-0"
            disabled={(hasAttachedFiles ? false : !input.trim()) || isLoading || isProcessingFiles}
          >
            {isLoading || isProcessingFiles ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send size={16} />}
          </Button>
        </div>
      </div>
      
      <div className="text-xs text-muted-foreground mt-2 ml-1 flex justify-between">
        <span>Press Shift+Enter for new line, Enter to send</span>
        <span className="text-gray-400">{input.length} characters</span>
      </div>
    </div>
  );
};

export default ChatInput;
