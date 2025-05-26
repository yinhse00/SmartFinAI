
import { useState, useEffect } from 'react';

interface WorkflowStageMappingProps {
  processingStage: string;
}

/**
 * Hook to handle workflow stage mapping and conversion
 */
export const useWorkflowStageMapping = ({ processingStage }: WorkflowStageMappingProps) => {
  const [currentWorkflowStep, setCurrentWorkflowStep] = useState<'preparing' | 'processing' | 'finalizing' | 'reviewing'>('preparing');

  // Convert processingStage string to proper workflow step
  useEffect(() => {
    if (!processingStage) {
      setCurrentWorkflowStep('preparing');
      return;
    }
    
    console.log('Processing stage changed to:', processingStage);
    
    // Map string values to proper workflow steps with more specific matching
    const stage = processingStage.toLowerCase();
    
    if (stage.includes('analyzing') || stage.includes('cached') || stage.includes('preparing')) {
      setCurrentWorkflowStep('preparing');
    } else if (stage.includes('regulatory context') || stage.includes('guidance') || stage.includes('searching for relevant')) {
      setCurrentWorkflowStep('processing');
    } else if (stage.includes('generating') || stage.includes('detailed response')) {
      setCurrentWorkflowStep('finalizing');
    } else if (stage.includes('reviewing') || stage.includes('validating') || stage.includes('checking')) {
      setCurrentWorkflowStep('reviewing');
    } else {
      // Default based on content
      if (stage.includes('processing') || stage.includes('gathering')) {
        setCurrentWorkflowStep('processing');
      } else if (stage.includes('response') || stage.includes('generating')) {
        setCurrentWorkflowStep('finalizing');
      } else {
        setCurrentWorkflowStep('preparing');
      }
    }
  }, [processingStage]);

  const getCurrentStep = (): 'preparing' | 'processing' | 'finalizing' | 'reviewing' => {
    return currentWorkflowStep;
  };

  return {
    getCurrentStep
  };
};
