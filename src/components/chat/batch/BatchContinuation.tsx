
import React from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';

interface BatchContinuationProps {
  isBatching: boolean;
  autoBatch: boolean;
  currentBatchNumber: number;
  handleContinueBatch: () => void;
  lastInputWasChinese: boolean;
}

const BatchContinuation: React.FC<BatchContinuationProps> = ({
  isBatching,
  autoBatch,
  currentBatchNumber,
  handleContinueBatch,
  lastInputWasChinese
}) => {
  if (!isBatching || autoBatch) {
    return null;
  }

  return (
    <div className="flex flex-col items-center my-4 gap-2">
      <div className="text-sm text-gray-500 dark:text-gray-400">
        {lastInputWasChinese 
          ? `回复尚未完成，需要继续生成更多内容。` 
          : `The response is incomplete. Continue to see more information.`
        }
      </div>
      <Button
        variant="default"
        className="flex items-center gap-2 bg-finance-accent-blue text-white px-6 py-2"
        onClick={handleContinueBatch}
      >
        <RefreshCw size={16} /> 
        {lastInputWasChinese 
          ? `继续下一部分 (第 ${currentBatchNumber + 1} 部分)` 
          : `Continue to Next Part (Part ${currentBatchNumber + 1})`
        }
      </Button>
    </div>
  );
};

export default BatchContinuation;
