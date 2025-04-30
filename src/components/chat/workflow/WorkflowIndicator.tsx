
import React from 'react';
import { Progress } from '@/components/ui/progress';

// Define the workflow steps based on your 5-step process
const workflowSteps = {
  'initial': { index: 0, label: 'Step 1: Initial Processing' },
  'listingRules': { index: 1, label: 'Step 2: Listing Rules Analysis' },
  'takeoversCode': { index: 2, label: 'Step 3: Takeovers Code Analysis' },
  'execution': { index: 3, label: 'Step 4: Execution Guidance' },
  'response': { index: 4, label: 'Step 5: Preparing Response' },
  'complete': { index: 5, label: 'Complete' }
};

interface WorkflowIndicatorProps {
  currentStep: 'initial' | 'listingRules' | 'takeoversCode' | 'execution' | 'response' | 'complete';
  stepProgress: string;
}

const WorkflowIndicator: React.FC<WorkflowIndicatorProps> = ({ 
  currentStep, 
  stepProgress 
}) => {
  const currentIndex = workflowSteps[currentStep]?.index || 0;
  const totalSteps = Object.keys(workflowSteps).length - 1; // Excluding 'complete'
  const progressPercentage = (currentIndex / totalSteps) * 100;
  
  return (
    <div className="p-2 bg-gray-50 dark:bg-gray-900">
      <div className="flex justify-between items-center mb-1">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {workflowSteps[currentStep]?.label || 'Processing'}
        </span>
        <span className="text-xs text-gray-500">
          {currentStep !== 'complete' ? stepProgress : 'Analysis complete'}
        </span>
      </div>
      <Progress value={progressPercentage} className="h-1.5" />
    </div>
  );
};

export default WorkflowIndicator;
