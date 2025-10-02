
import React from 'react';
import { WorkflowStep } from './hooks/workflow/types';
import { Loader2, Brain, Database, MessagesSquare, ListChecks, Check } from 'lucide-react';
import { htmlFormatter } from '@/services/response/modules/htmlFormatter';
import { createSafeMarkup } from '@/utils/sanitize';

interface ProcessingOverlayProps {
  currentStep: WorkflowStep;
  stepProgress: string;
  isChineseInterface?: boolean;
}

const ProcessingOverlay: React.FC<ProcessingOverlayProps> = ({ 
  currentStep, 
  stepProgress,
  isChineseInterface = false 
}) => {
  // Get appropriate step labels based on language
  const stepLabels = isChineseInterface ? {
    initial: '初步分析',
    listingRules: '上市规则搜索',
    takeoversCode: '收购守则搜索',
    execution: '执行程序搜索',
    response: '生成回复',
    complete: '已完成'
  } : {
    initial: 'Initial Analysis',
    listingRules: 'Listing Rules Search',
    takeoversCode: 'Takeovers Code Search',
    execution: 'Execution Process Search',
    response: 'Generating Response',
    complete: 'Complete'
  };

  // Step status determination
  const getStepStatus = (step: WorkflowStep) => {
    const steps: WorkflowStep[] = ['initial', 'listingRules', 'takeoversCode', 'execution', 'response', 'complete'];
    const currentIndex = steps.indexOf(currentStep);
    const stepIndex = steps.indexOf(step);
    
    if (stepIndex < currentIndex) return 'complete';
    if (stepIndex === currentIndex) return 'active';
    return 'pending';
  };

  // Step icon mapping
  const StepIcon = ({ step }: { step: WorkflowStep }) => {
    const status = getStepStatus(step);
    
    if (status === 'complete') {
      return <Check className="h-5 w-5 text-green-500" />;
    }
    
    switch (step) {
      case 'initial':
        return <Brain className={`h-5 w-5 ${status === 'active' ? 'text-blue-500 animate-pulse' : 'text-gray-400'}`} />;
      case 'listingRules':
        return <Database className={`h-5 w-5 ${status === 'active' ? 'text-blue-500 animate-pulse' : 'text-gray-400'}`} />;
      case 'takeoversCode':
        return <Database className={`h-5 w-5 ${status === 'active' ? 'text-blue-500 animate-pulse' : 'text-gray-400'}`} />;
      case 'execution':
        return <ListChecks className={`h-5 w-5 ${status === 'active' ? 'text-blue-500 animate-pulse' : 'text-gray-400'}`} />;
      case 'response':
        return <MessagesSquare className={`h-5 w-5 ${status === 'active' ? 'text-blue-500 animate-pulse' : 'text-gray-400'}`} />;
      default:
        return <Loader2 className={`h-5 w-5 ${status === 'active' ? 'text-blue-500 animate-pulse' : 'text-gray-400'}`} />;
    }
  };
  
  return (
    <div className="fixed inset-0 bg-black/20 dark:bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
        <div className="flex items-center justify-center mb-4">
          <Loader2 className="h-6 w-6 text-blue-500 animate-spin mr-2" />
          <h2 className="text-xl font-semibold">
            {isChineseInterface ? '正在处理您的请求' : 'Processing Your Request'}
          </h2>
        </div>
        
        <div className="space-y-4 mb-6">
          {(['initial', 'listingRules', 'takeoversCode', 'execution', 'response'] as WorkflowStep[]).map((step) => {
            const status = getStepStatus(step);
            return (
              <div 
                key={step}
                className={`flex items-center ${
                  status === 'active' 
                    ? 'text-blue-600 dark:text-blue-400' 
                    : status === 'complete'
                    ? 'text-green-600 dark:text-green-400'
                    : 'text-gray-400'
                }`}
              >
                <div className="flex-shrink-0 mr-3">
                  <StepIcon step={step} />
                </div>
                <div className="flex-1">
                  <p className="font-medium">{stepLabels[step]}</p>
                {status === 'active' && (
                  <p 
                    className="text-sm opacity-80"
                    dangerouslySetInnerHTML={createSafeMarkup(htmlFormatter.applyHtmlFormatting(stepProgress))}
                  />
                )}
                </div>
                {status === 'active' && (
                  <div className="ml-2">
                    <div className="h-2 w-2 rounded-full bg-blue-500 animate-ping" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
        
        <p className="text-center text-sm text-gray-500">
          {isChineseInterface 
            ? '我们正在分析您的问题，这可能需要几秒钟时间...'
            : 'We are analyzing your query, this may take a few seconds...'}
        </p>
      </div>
    </div>
  );
};

export default ProcessingOverlay;
