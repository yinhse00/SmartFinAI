
import React from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';

interface BatchContinuationProps {
  isBatching: boolean;
  autoBatch: boolean;
  currentBatchNumber: number;
  handleContinueBatch: () => void;
  lastInputWasChinese: boolean;
  isLoading?: boolean;
}

const BatchContinuation: React.FC<BatchContinuationProps> = ({
  isBatching,
  autoBatch,
  currentBatchNumber,
  handleContinueBatch,
  lastInputWasChinese,
  isLoading = false
}) => {
  // Don't show when auto-batching is enabled - this creates seamless experience
  if (!isBatching || autoBatch) {
    return null;
  }

  return (
    <div className="flex flex-col items-center my-4 gap-2">
      <div className="text-sm text-gray-600 dark:text-gray-400 py-2 px-4 rounded-full bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
        {lastInputWasChinese 
          ? `回复尚未完成，需要继续生成更多内容。` 
          : `Additional information available for this regulatory inquiry.`
        }
      </div>
      <Button
        variant="default"
        className="flex items-center gap-2 bg-finance-accent-blue text-white px-6 py-2 hover:bg-finance-dark-blue transition-colors shadow-sm"
        onClick={handleContinueBatch}
        disabled={isLoading}
      >
        <RefreshCw size={16} className={isLoading ? "animate-spin" : ""} /> 
        {lastInputWasChinese 
          ? `继续` 
          : `Continue Response`
        }
      </Button>
    </div>
  );
};

export default BatchContinuation;

