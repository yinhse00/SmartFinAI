
import React from 'react';
import { CardHeader, CardTitle } from '@/components/ui/card';
import { Bot, Key, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ChatHeaderProps {
  isGrokApiKeySet: boolean;
  onOpenApiKeyDialog: () => void;
}

const ChatHeader: React.FC<ChatHeaderProps> = ({ isGrokApiKeySet, onOpenApiKeyDialog }) => {
  return (
    <CardHeader className="pb-3 border-b">
      <CardTitle className="text-lg font-medium flex items-center gap-2">
        <Bot size={18} /> 
        Regulatory Assistant
        <div className="ml-auto flex items-center gap-2">
          <div className="flex items-center space-x-2">
            <span className="text-xs">Powered by Grok AI</span>
          </div>
          
          {!isGrokApiKeySet && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onOpenApiKeyDialog}
              className="text-xs flex items-center gap-1 border-amber-500 text-amber-600 hover:text-amber-700"
            >
              <Key size={14} /> Set API Key
            </Button>
          )}
          <a 
            href="https://www.grok.x.ai/"
            target="_blank" 
            rel="noopener noreferrer"
            className="text-xs text-finance-medium-blue dark:text-finance-accent-blue flex items-center gap-0.5 hover:underline"
          >
            About Grok AI <ExternalLink size={10} />
          </a>
        </div>
      </CardTitle>
    </CardHeader>
  );
};

export default ChatHeader;
