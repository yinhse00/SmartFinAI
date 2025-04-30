
import React from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw, ChevronDown, KeyRound } from 'lucide-react';

interface BatchContinuationProps {
  isBatching: boolean;
  autoBatch: boolean;
  currentBatchNumber: number;
  handleContinueBatch: () => void;
  lastInputWasChinese: boolean;
  isApiKeyRotating?: boolean; // New prop to show if API key rotation is active
}

const BatchContinuation: React.FC<BatchContinuationProps> = ({
  isBatching,
  autoBatch,
  currentBatchNumber,
  handleContinueBatch,
  lastInputWasChinese,
  isApiKeyRotating = true // Default to true for API key rotation status
}) => {
  if (!isBatching || autoBatch) {
    return null;
  }

  // Enhanced UI for batch continuation
  return (
    <div className="flex flex-col items-center my-4 gap-2 animate-pulse">
      <div className="text-sm text-gray-500 dark:text-gray-400 font-semibold">
        {lastInputWasChinese 
          ? `回复尚未完成，需要继续生成更多内容。点击下方按钮继续。` 
          : `The response is incomplete. Click below to continue generating more content.`
        }
      </div>
      <Button
        variant="default"
        className="flex items-center gap-2 bg-finance-accent-blue text-white px-6 py-3 hover:bg-finance-medium-blue transition-all duration-200 shadow-md"
        onClick={handleContinueBatch}
        size="lg"
      >
        <RefreshCw size={16} className="animate-spin-slow" /> 
        {lastInputWasChinese 
          ? `继续下一部分 (第 ${currentBatchNumber + 1} 部分)` 
          : `Continue to Part ${currentBatchNumber + 1}`
        }
        <ChevronDown size={14} className="ml-1" />
      </Button>
      <div className="text-xs text-gray-400 dark:text-gray-500 mt-1 flex items-center gap-1">
        {isApiKeyRotating && <KeyRound size={10} className="animate-pulse" />}
        {lastInputWasChinese 
          ? `优化中: 使用API密钥轮换以避免CORS问题和提高响应速度` 
          : `Optimized: Using API key rotation to avoid CORS issues and improve response speed`
        }
      </div>
    </div>
  );
};

export default BatchContinuation;
