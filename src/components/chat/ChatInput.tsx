
import React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Send, Loader2 } from 'lucide-react';
import UnifiedUploadButton from './upload/UnifiedUploadButton';

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
}

const ChatInput: React.FC<ChatInputProps> = ({
  input,
  setInput,
  handleSend,
  isLoading,
  handleKeyDown,
  onFileSelect,
  placeholder = "Ask about HK listing rules, takeovers, or compliance requirements...",
  isProcessingFiles = false
}) => {
  return (
    <div className="p-4 border-t">
      <div className="flex gap-2 items-center">
        {onFileSelect && (
          <UnifiedUploadButton 
            onFileSelect={onFileSelect} 
            isProcessing={isProcessingFiles}
          />
        )}
        <Input
          className="flex-1 bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700"
          placeholder={placeholder}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isLoading || isProcessingFiles}
        />
        <Button 
          onClick={handleSend} 
          className="bg-finance-medium-blue hover:bg-finance-dark-blue"
          disabled={!input.trim() || isLoading || isProcessingFiles}
        >
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send size={18} />}
        </Button>
      </div>
    </div>
  );
};

export default ChatInput;
