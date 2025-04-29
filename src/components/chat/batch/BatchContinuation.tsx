
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
    <div className="flex justify-center my-4">
      <Button
        variant="default"
        className="flex items-center gap-2 bg-finance-accent-blue text-white"
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
