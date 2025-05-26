
import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';

interface MessageErrorProps {
  onRetry?: () => void;
}

export const MessageError: React.FC<MessageErrorProps> = ({ onRetry }) => {
  return (
    <div className="flex justify-start mb-4 w-full">
      <Card className="p-3 rounded-lg bg-red-50 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300 w-full">
        <div className="whitespace-pre-line">
          Message content is empty. There might be an issue with the response generation.
          {onRetry && (
            <div className="mt-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={onRetry} 
                className="bg-red-100 text-red-800 border-red-200 hover:bg-red-200 dark:bg-red-900/50 dark:text-red-300 dark:border-red-700"
              >
                <RefreshCw size={12} className="mr-1" />
                Retry query
              </Button>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};
