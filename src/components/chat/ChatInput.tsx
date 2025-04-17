
import React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Send, Loader2, Info, Calendar, FileText, BookOpen } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

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
      
      <div className="mt-2 text-xs space-y-1">
        <div className="text-gray-600 dark:text-gray-300 flex items-center gap-1">
          <Info size={12} />
          <span>
            SmartFinAI provides Hong Kong regulatory assistance with database-backed responses.
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
        
        <div className="flex gap-1 flex-wrap">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge 
                  variant="outline" 
                  className="text-xs cursor-pointer bg-finance-light-blue/20 hover:bg-finance-light-blue/40"
                  onClick={() => setInput("Please construct a rights issue timetable when the starting date is 1 June 2025")}
                >
                  <Calendar size={10} className="mr-1" />
                  Rights Issue Timetable
                </Badge>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs">Request a detailed rights issue timetable</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge 
                  variant="outline" 
                  className="text-xs cursor-pointer bg-finance-light-blue/20 hover:bg-finance-light-blue/40"
                  onClick={() => setInput("Explain connected transaction requirements under Chapter 14A")}
                >
                  <FileText size={10} className="mr-1" />
                  Connected Transactions
                </Badge>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs">Learn about connected transaction requirements</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge 
                  variant="outline" 
                  className="text-xs cursor-pointer bg-finance-light-blue/20 hover:bg-finance-light-blue/40"
                  onClick={() => setInput("Explain takeovers code Rule 26 mandatory offer requirements")}
                >
                  <BookOpen size={10} className="mr-1" />
                  Takeovers Code
                </Badge>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs">Learn about mandatory offer requirements</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
    </div>
  );
};

export default ChatInput;
