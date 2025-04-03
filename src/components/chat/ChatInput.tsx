
import React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Send, Loader2, Info } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface ChatInputProps {
  input: string;
  setInput: (input: string) => void;
  handleSend: () => void;
  isLoading: boolean;
  isGrokApiKeySet: boolean;
  onOpenApiKeyDialog: () => void;
  handleKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
}

const ChatInput: React.FC<ChatInputProps> = ({
  input,
  setInput,
  handleSend,
  isLoading,
  isGrokApiKeySet,
  onOpenApiKeyDialog,
  handleKeyDown
}) => {
  return (
    <div className="p-4 border-t">
      <div className="flex gap-2">
        <Input
          className="flex-1"
          placeholder="Ask about HK listing rules, takeovers, or regulatory requirements..."
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
      <div className="mt-2 text-xs text-gray-500 flex items-center gap-1">
        <Info size={12} />
        <span>
          Using Grok AI for accurate regulatory assistance. Responses include context from our database.
          {!isGrokApiKeySet && (
            <Badge 
              variant="outline" 
              className="ml-1 text-xs bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300"
            >
              API Key Required
            </Badge>
          )}
        </span>
      </div>
    </div>
  );
};

export default ChatInput;
