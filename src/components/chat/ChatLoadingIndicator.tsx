
import React from 'react';
import { Loader2 } from 'lucide-react';

const ChatLoadingIndicator: React.FC = () => {
  return (
    <div className="flex justify-start">
      <div className="max-w-[80%] rounded-lg p-4 bg-gray-100 dark:bg-finance-dark-blue/50">
        <div className="flex items-center space-x-2">
          <Loader2 size={18} className="animate-spin text-finance-medium-blue" />
          <span className="text-sm">Generating response...</span>
        </div>
      </div>
    </div>
  );
};

export default ChatLoadingIndicator;
