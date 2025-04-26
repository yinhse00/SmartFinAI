
import React from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';

interface TruncationWarningProps {
  onRetry?: () => void;
}

const TruncationWarning: React.FC<TruncationWarningProps> = ({ onRetry }) => {
  if (!onRetry) return null;

  return (
    <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-md p-3 mb-4 flex justify-between items-center">
      <div className="text-sm text-amber-800 dark:text-amber-300">
        Some responses appear to be incomplete. You can retry your queries to get complete answers.
      </div>
      <button
        onClick={onRetry}
        className="text-xs bg-amber-100 hover:bg-amber-200 dark:bg-amber-800/40 dark:hover:bg-amber-800/60 text-amber-800 dark:text-amber-300 px-3 py-1 rounded"
      >
        Retry Last Query
      </button>
    </div>
  );
};

export default TruncationWarning;
