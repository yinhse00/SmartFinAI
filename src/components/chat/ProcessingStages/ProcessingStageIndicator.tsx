
import React from 'react';

type StageType = 'preparing' | 'processing' | 'finalizing' | 'reviewing';

interface ProcessingStageIndicatorProps {
  stage: StageType;
}

const ProcessingStageIndicator: React.FC<ProcessingStageIndicatorProps> = ({ stage }) => {
  return (
    <div className="flex items-center justify-between text-xs">
      <div className={`flex flex-col items-center ${stage === 'preparing' ? 'text-finance-medium-blue font-medium' : 'text-gray-500'}`}>
        <div className={`w-4 h-4 rounded-full mb-1 ${stage === 'preparing' ? 'bg-finance-medium-blue animate-pulse' : (stage === 'reviewing' || stage === 'processing' || stage === 'finalizing') ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-700'}`}>
          {(stage === 'reviewing' || stage === 'processing' || stage === 'finalizing') && <span className="text-white flex items-center justify-center h-full text-[10px]">✓</span>}
        </div>
        <span>Context</span>
      </div>
      <div className="h-px w-[20%] bg-gray-300 dark:bg-gray-700 self-center mt-1"></div>
      <div className={`flex flex-col items-center ${stage === 'reviewing' ? 'text-finance-medium-blue font-medium' : 'text-gray-500'}`}>
        <div className={`w-4 h-4 rounded-full mb-1 ${stage === 'reviewing' ? 'bg-finance-medium-blue animate-pulse' : (stage === 'processing' || stage === 'finalizing') ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-700'}`}>
          {(stage === 'processing' || stage === 'finalizing') && <span className="text-white flex items-center justify-center h-full text-[10px]">✓</span>}
        </div>
        <span>Review</span>
      </div>
      <div className="h-px w-[20%] bg-gray-300 dark:bg-gray-700 self-center mt-1"></div>
      <div className={`flex flex-col items-center ${stage === 'processing' ? 'text-finance-medium-blue font-medium' : 'text-gray-500'}`}>
        <div className={`w-4 h-4 rounded-full mb-1 ${stage === 'processing' ? 'bg-finance-medium-blue animate-pulse' : stage === 'finalizing' ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-700'}`}>
          {stage === 'finalizing' && <span className="text-white flex items-center justify-center h-full text-[10px]">✓</span>}
        </div>
        <span>Generate</span>
      </div>
      <div className="h-px w-[20%] bg-gray-300 dark:bg-gray-700 self-center mt-1"></div>
      <div className={`flex flex-col items-center ${stage === 'finalizing' ? 'text-finance-medium-blue font-medium' : 'text-gray-500'}`}>
        <div className={`w-4 h-4 rounded-full mb-1 ${stage === 'finalizing' ? 'bg-finance-medium-blue animate-pulse' : 'bg-gray-300 dark:bg-gray-700'}`}></div>
        <span>Deliver</span>
      </div>
    </div>
  );
};

export default ProcessingStageIndicator;
