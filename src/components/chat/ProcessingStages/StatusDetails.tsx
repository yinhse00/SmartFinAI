
import React from 'react';

interface StatusDetailsProps {
  stage: 'preparing' | 'processing' | 'finalizing' | 'reviewing';
  progress: number;
}

const StatusDetails: React.FC<StatusDetailsProps> = ({ stage, progress }) => {
  return (
    <div className="text-xs text-gray-500 dark:text-gray-400 italic">
      {stage === 'reviewing' && 
        <div className="mt-1 flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-finance-medium-blue animate-pulse"></div>
          <span>Checking database for accurate information...</span>
        </div>
      }
      {stage === 'processing' && progress > 50 && 
        <div className="mt-1 flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
          <span>Optimizing response to prevent truncation...</span>
        </div>
      }
    </div>
  );
};

export default StatusDetails;
