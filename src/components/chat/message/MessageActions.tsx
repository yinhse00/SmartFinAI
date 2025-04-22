
import React from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';

interface MessageActionsProps {
  isTruncated: boolean;
  sender: 'user' | 'bot';
  isTypingComplete: boolean;
  onRetry?: () => void;
}

const MessageActions: React.FC<MessageActionsProps> = ({ 
  isTruncated, 
  sender, 
  isTypingComplete, 
  onRetry 
}) => {
  if (!isTruncated || sender !== 'bot' || !onRetry || !isTypingComplete) {
    return null;
  }

  return (
    <div className="mt-3 pt-2 border-t border-gray-200 dark:border-gray-700">
      <Button 
        variant="outline" 
        size="sm" 
        onClick={onRetry}
        className="flex items-center text-xs bg-finance-light-blue/20 hover:bg-finance-light-blue/40 text-finance-dark-blue hover:text-finance-dark-blue"
      >
        <RefreshCw size={12} className="mr-1" />
        Retry query
      </Button>
    </div>
  );
};

export default MessageActions;
