
import React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Send, Loader2 } from 'lucide-react';
import UploadButtons from './upload/UploadButtons';

interface ChatInputProps {
  input: string;
  setInput: (input: string) => void;
  handleSend: () => void;
  isLoading: boolean;
  isGrokApiKeySet: boolean;
  onOpenApiKeyDialog: () => void;
  handleKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onFileSelect?: (files: FileList) => void;
}

const ChatInput: React.FC<ChatInputProps> = ({
  input,
  setInput,
  handleSend,
  isLoading,
  handleKeyDown,
  onFileSelect
}) => {
  return (
    <div className="p-4 border-t">
      <div className="flex flex-col space-y-2">
        <div className="flex gap-2 items-center">
          {onFileSelect && <UploadButtons onFileSelect={onFileSelect} />}
          <Input
            className="flex-1 bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700"
            placeholder="Ask about HK listing rules, takeovers, or compliance requirements..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
          />
          <Button 
            onClick={handleSend} 
            className="bg-finance-medium-blue hover:bg-finance-dark-blue"
            disabled={!input.trim() || isLoading}
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send size={18} />}
          </Button>
        </div>
        {onFileSelect && (
          <div className="text-xs text-gray-500 dark:text-gray-400">
            Press the attachment icon to upload documents (PDF, Word, Excel) or images
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatInput;
