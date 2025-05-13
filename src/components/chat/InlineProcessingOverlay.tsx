
import React from 'react';
import { WorkflowStep } from './hooks/workflow/types';
import { Loader2, Brain, Database, MessagesSquare, ListChecks, Check } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface InlineProcessingOverlayProps {
  currentStep: WorkflowStep | 'preparing' | 'processing' | 'finalizing' | 'reviewing';
  stepProgress: string;
  isChineseInterface?: boolean;
  isVisible: boolean;
}

// Map processing stages to workflow steps if needed
const mapProcessingToWorkflow = (step: 'preparing' | 'processing' | 'finalizing' | 'reviewing'): WorkflowStep => {
  switch (step) {
    case 'preparing': return 'initial';
    case 'processing': return 'execution';
    case 'finalizing': return 'response';
    case 'reviewing': return 'listingRules';
    default: return 'initial';
  }
};

const InlineProcessingOverlay: React.FC<InlineProcessingOverlayProps> = ({ 
  currentStep, 
  stepProgress,
  isChineseInterface = false,
  isVisible
}) => {
  if (!isVisible) return null;
  
  // Handle both WorkflowStep and processing stage formats
  const workflowStep = typeof currentStep === 'string' && 
    ['preparing', 'processing', 'finalizing', 'reviewing'].includes(currentStep) 
    ? mapProcessingToWorkflow(currentStep as 'preparing' | 'processing' | 'finalizing' | 'reviewing') 
    : currentStep as WorkflowStep;
  
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
    const currentIndex = steps.indexOf(workflowStep);
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
    <div className="bg-white dark:bg-gray-900 rounded-lg shadow-md p-4 mb-4 border border-gray-200 dark:border-gray-700 w-full">
      <div className="flex items-center justify-center mb-4">
        <Loader2 className="h-6 w-6 text-blue-500 animate-spin mr-2" />
        <h2 className="text-xl font-semibold">
          {isChineseInterface ? '正在处理您的请求' : 'Processing Your Request'}
        </h2>
      </div>
      
      <Progress value={65} className="h-2 bg-gray-200 dark:bg-gray-700 mb-4" />
      
      <div className="space-y-4 mb-4">
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
                  <p className="text-sm opacity-80">{stepProgress}</p>
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
  );
};

export default InlineProcessingOverlay;
