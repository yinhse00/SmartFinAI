import { useState, useEffect } from 'react';

interface WorkflowStageMappingProps {
  processingStage: string;
}

/**
 * Enhanced hook to handle workflow stage mapping with improved state persistence
 */
export const useWorkflowStageMapping = ({ processingStage }: WorkflowStageMappingProps) => {
  const [currentWorkflowStep, setCurrentWorkflowStep] = useState<'preparing' | 'processing' | 'finalizing' | 'reviewing'>('preparing');
  const [lastStageTime, setLastStageTime] = useState<number>(Date.now());

  // Enhanced stage mapping with better persistence
  useEffect(() => {
    if (!processingStage) {
      // Don't immediately reset - only reset after a delay when truly complete
      const now = Date.now();
      if (now - lastStageTime > 2000) { // 2 second delay before reset
        setCurrentWorkflowStep('preparing');
      }
      return;
    }
    
    console.log('Processing stage changed to:', processingStage);
    setLastStageTime(Date.now());
    
    // Enhanced mapping with more specific patterns
    const stage = processingStage.toLowerCase();
    
    if (stage.includes('analyzing') || stage.includes('cache') || stage.includes('preparing') || stage.includes('checking cached')) {
      setCurrentWorkflowStep('preparing');
    } else if (stage.includes('regulatory context') || stage.includes('guidance') || stage.includes('searching') || stage.includes('gathering') || stage.includes('quality scoring')) {
      setCurrentWorkflowStep('processing');
    } else if (stage.includes('generating') || stage.includes('response') || stage.includes('comprehensive') || stage.includes('fast path')) {
      setCurrentWorkflowStep('finalizing');
    } else if (stage.includes('reviewing') || stage.includes('validating') || stage.includes('checking') || stage.includes('quality') || stage.includes('complete')) {
      setCurrentWorkflowStep('reviewing');
    } else {
      // Intelligent fallback based on keywords
      if (stage.includes('processing') || stage.includes('retrieval')) {
        setCurrentWorkflowStep('processing');
      } else if (stage.includes('building') || stage.includes('creating')) {
        setCurrentWorkflowStep('finalizing');
      } else if (stage.includes('error') || stage.includes('retry')) {
        setCurrentWorkflowStep('reviewing');
      } else {
        // Keep current state if unclear
        console.log('Stage mapping unclear, keeping current state:', currentWorkflowStep);
      }
    }
  }, [processingStage, lastStageTime, currentWorkflowStep]);

  const getCurrentStep = (): 'preparing' | 'processing' | 'finalizing' | 'reviewing' => {
    return currentWorkflowStep;
  };

  // Additional helper to check if workflow is active
  const isWorkflowActive = (): boolean => {
    const now = Date.now();
    return (now - lastStageTime) < 3000 || Boolean(processingStage);
  };

  return {
    getCurrentStep,
    isWorkflowActive
  };
};
