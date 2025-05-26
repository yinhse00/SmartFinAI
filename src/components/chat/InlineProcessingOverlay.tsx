
import React, { useState, useEffect } from 'react';
import { WorkflowStep } from './hooks/workflow/types';
import { Loader2, Brain, Database, MessagesSquare, ListChecks, Check, Zap } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface InlineProcessingOverlayProps {
  currentStep: WorkflowStep | 'preparing' | 'processing' | 'finalizing' | 'reviewing';
  stepProgress: string;
  isChineseInterface?: boolean;
  isVisible: boolean;
}

// Enhanced mapping with better accuracy
const mapProcessingToWorkflow = (step: 'preparing' | 'processing' | 'finalizing' | 'reviewing'): WorkflowStep => {
  switch (step) {
    case 'preparing': return 'initial';
    case 'processing': return 'listingRules';
    case 'finalizing': return 'response';
    case 'reviewing': return 'execution';
    default: return 'initial';
  }
};

// Enhanced text-based mapping with cache and optimization indicators
const mapProcessingTextToWorkflow = (stepProgress: string): WorkflowStep => {
  if (!stepProgress) return 'initial';
  
  const stage = stepProgress.toLowerCase();
  
  if (stage.includes('cache') || stage.includes('analyzing') || stage.includes('preparing')) {
    return 'initial';
  } else if (stage.includes('regulatory context') || stage.includes('guidance') || stage.includes('gathering') || stage.includes('quality scoring')) {
    return 'listingRules';
  } else if (stage.includes('fast path') || stage.includes('intelligent search') || stage.includes('patterns')) {
    return 'takeoversCode';
  } else if (stage.includes('generating') || stage.includes('response') || stage.includes('comprehensive')) {
    return 'response';
  } else if (stage.includes('validating') || stage.includes('complete') || stage.includes('ready') || stage.includes('quality')) {
    return 'execution';
  }
  
  return 'initial';
};

const InlineProcessingOverlay: React.FC<InlineProcessingOverlayProps> = ({ 
  currentStep, 
  stepProgress,
  isChineseInterface = false,
  isVisible
}) => {
  const [progressValue, setProgressValue] = useState(15);
  const [displayStep, setDisplayStep] = useState<WorkflowStep>('initial');
  const [isOptimized, setIsOptimized] = useState(false);
  
  // Enhanced progress calculation and step determination
  useEffect(() => {
    if (!isVisible) return;
    
    console.log('InlineProcessingOverlay - currentStep:', currentStep, 'stepProgress:', stepProgress);
    
    const steps: WorkflowStep[] = ['initial', 'listingRules', 'takeoversCode', 'execution', 'response', 'complete'];
    
    // Check for optimization indicators
    const optimizationKeywords = ['cache', 'fast path', 'cached', 'similarity', 'quality scoring'];
    setIsOptimized(optimizationKeywords.some(keyword => stepProgress.toLowerCase().includes(keyword)));
    
    // Determine the actual workflow step to display
    let actualStep: WorkflowStep;
    
    // Prioritize text-based mapping for more accuracy
    if (stepProgress) {
      actualStep = mapProcessingTextToWorkflow(stepProgress);
    } else if (typeof currentStep === 'string' && ['preparing', 'processing', 'finalizing', 'reviewing'].includes(currentStep)) {
      actualStep = mapProcessingToWorkflow(currentStep as 'preparing' | 'processing' | 'finalizing' | 'reviewing');
    } else {
      actualStep = currentStep as WorkflowStep;
    }
    
    setDisplayStep(actualStep);
    
    const stepIndex = steps.indexOf(actualStep);
    
    // Enhanced progress calculation with optimization bonuses
    let baseProgress = Math.max(15, (stepIndex / (steps.length - 1)) * 90);
    
    // Add progress bonuses for optimization features
    if (stepProgress) {
      if (stepProgress.includes('cached') || stepProgress.includes('cache')) {
        baseProgress = Math.max(baseProgress, 85); // Cache hits are fast
      } else if (stepProgress.includes('fast path')) {
        baseProgress = Math.max(baseProgress, 70);
      } else if (stepProgress.includes('quality scoring')) {
        baseProgress = Math.max(baseProgress, 60);
      } else if (stepProgress.includes('generating')) {
        baseProgress = Math.max(baseProgress, 75);
      } else if (stepProgress.includes('complete') || stepProgress.includes('ready')) {
        baseProgress = 95;
      }
    }
    
    // Smooth progress animation
    setProgressValue(Math.min(95, baseProgress));
  }, [currentStep, stepProgress, isVisible]);
  
  if (!isVisible) return null;
  
  // Enhanced step labels with optimization indicators
  const stepLabels = isChineseInterface ? {
    initial: isOptimized ? '智能分析' : '初步分析',
    listingRules: isOptimized ? '智能搜索上市规则' : '上市规则搜索',
    takeoversCode: isOptimized ? '快速路径处理' : '收购守则搜索',
    execution: isOptimized ? '质量验证' : '执行程序搜索',
    response: '生成回复',
    complete: '已完成'
  } : {
    initial: isOptimized ? 'Smart Analysis' : 'Initial Analysis',
    listingRules: isOptimized ? 'Intelligent Context Search' : 'Listing Rules Search',
    takeoversCode: isOptimized ? 'Fast Path Processing' : 'Takeovers Code Search',
    execution: isOptimized ? 'Quality Validation' : 'Execution Process Search',
    response: 'Generating Response',
    complete: 'Complete'
  };

  // Enhanced step status determination
  const getStepStatus = (step: WorkflowStep) => {
    const steps: WorkflowStep[] = ['initial', 'listingRules', 'takeoversCode', 'execution', 'response', 'complete'];
    const currentIndex = steps.indexOf(displayStep);
    const stepIndex = steps.indexOf(step);
    
    if (stepIndex < currentIndex) return 'complete';
    if (stepIndex === currentIndex) return 'active';
    return 'pending';
  };

  // Enhanced step icon mapping with optimization indicators
  const StepIcon = ({ step }: { step: WorkflowStep }) => {
    const status = getStepStatus(step);
    
    if (status === 'complete') {
      return <Check className="h-5 w-5 text-green-500" />;
    }
    
    const iconClass = status === 'active' 
      ? `h-5 w-5 ${isOptimized ? 'text-orange-500' : 'text-blue-500'} animate-pulse` 
      : 'h-5 w-5 text-gray-400';
    
    switch (step) {
      case 'initial':
        return isOptimized ? <Zap className={iconClass} /> : <Brain className={iconClass} />;
      case 'listingRules':
        return <Database className={iconClass} />;
      case 'takeoversCode':
        return isOptimized ? <Zap className={iconClass} /> : <Database className={iconClass} />;
      case 'execution':
        return <ListChecks className={iconClass} />;
      case 'response':
        return <MessagesSquare className={iconClass} />;
      case 'complete':
        return <Check className="h-5 w-5 text-green-500" />;
      default:
        return <Loader2 className={iconClass} />;
    }
  };
  
  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg shadow-md p-4 mb-4 border border-gray-200 dark:border-gray-700 w-full animate-fade-in">
      <div className="flex items-center justify-center mb-4">
        <Loader2 className={`h-6 w-6 ${isOptimized ? 'text-orange-500' : 'text-blue-500'} animate-spin mr-2`} />
        <h2 className="text-xl font-semibold">
          {isChineseInterface ? '正在处理您的请求' : 'Processing Your Request'}
          {isOptimized && (
            <span className="ml-2 text-sm text-orange-500 font-normal">
              {isChineseInterface ? '(优化模式)' : '(Optimized)'}
            </span>
          )}
        </h2>
      </div>
      
      <Progress 
        value={progressValue} 
        className={`h-2 mb-4 ${isOptimized ? 'bg-orange-100 dark:bg-orange-900' : 'bg-gray-200 dark:bg-gray-700'}`} 
      />
      
      <div className="space-y-4 mb-4">
        {(['initial', 'listingRules', 'takeoversCode', 'execution', 'response'] as WorkflowStep[]).map((step) => {
          const status = getStepStatus(step);
          return (
            <div 
              key={step}
              className={`flex items-center transition-all duration-300 ${
                status === 'active' 
                  ? `${isOptimized ? 'text-orange-600 dark:text-orange-400' : 'text-blue-600 dark:text-blue-400'}` 
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
                {status === 'active' && stepProgress && (
                  <p className="text-sm opacity-80">{stepProgress}</p>
                )}
              </div>
              {status === 'active' && (
                <div className="ml-2">
                  <div className={`h-2 w-2 rounded-full ${isOptimized ? 'bg-orange-500' : 'bg-blue-500'} animate-ping`} />
                </div>
              )}
            </div>
          );
        })}
      </div>
      
      <p className="text-center text-sm text-gray-500">
        {isChineseInterface 
          ? isOptimized 
            ? '我们正在使用优化算法快速分析您的问题...'
            : '我们正在分析您的问题，这可能需要几秒钟时间...'
          : isOptimized
            ? 'We are using optimized algorithms to quickly analyze your query...'
            : 'We are analyzing your query, this may take a few seconds...'}
      </p>
    </div>
  );
};

export default InlineProcessingOverlay;
