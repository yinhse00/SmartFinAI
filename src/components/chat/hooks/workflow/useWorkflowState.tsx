import { useState, useEffect, useCallback } from 'react';
import { workflowStateManager, WorkflowState } from '../../workflow/workflowStateManager';
import { workflowMessageManager, MessageContext } from '../../workflow/workflowMessageManager';
import { WorkflowPhase, ProcessingState } from '../../workflow/workflowConfig';

export type WorkflowCurrentStep = WorkflowPhase;

export const useWorkflowState = () => {
  const [workflowState, setWorkflowState] = useState<WorkflowState>(
    workflowStateManager.getCurrentState()
  );
  const [processingStage, setProcessingStage] = useState('');

  // Subscribe to workflow state changes
  useEffect(() => {
    const unsubscribe = workflowStateManager.subscribe((state) => {
      setWorkflowState(state);
    });

    return unsubscribe;
  }, []);

  const startWorkflow = useCallback(() => {
    workflowStateManager.startWorkflow();
    workflowMessageManager.clearHistory();
    setProcessingStage('');
  }, []);

  const updateStage = useCallback((stage: string) => {
    setProcessingStage(stage);
    workflowStateManager.updateFromStageMessage(stage);
  }, []);

  const updateStep = useCallback((step: WorkflowCurrentStep) => {
    // This is now handled automatically by the state manager
    // but we keep the interface for compatibility
    console.log('Step update requested:', step);
  }, []);

  const completeWorkflow = useCallback(() => {
    workflowStateManager.completeWorkflow();
    
    setTimeout(() => {
      setProcessingStage('Complete');
      setTimeout(() => {
        setProcessingStage('');
      }, 1500);
    }, 1000);
  }, []);

  const handleError = useCallback(() => {
    workflowStateManager.updateProcessingState(ProcessingState.PREPARING);
    setProcessingStage('');
  }, []);

  // Generate dynamic message for current state
  const getCurrentMessage = useCallback((isChinese = false): string => {
    const context: MessageContext = {
      isOptimized: workflowState.isOptimized,
      isChinese,
      elapsedTime: workflowState.elapsedTime
    };

    return workflowMessageManager.getDynamicMessage(
      workflowState.currentPhase,
      context,
      processingStage
    );
  }, [workflowState, processingStage]);

  return {
    isLoading: workflowState.currentPhase !== WorkflowPhase.COMPLETE && workflowState.progress > 0,
    processingStage,
    currentStep: workflowState.currentPhase,
    progress: workflowState.progress,
    isOptimized: workflowState.isOptimized,
    elapsedTime: workflowState.elapsedTime,
    estimatedTimeRemaining: workflowState.estimatedTimeRemaining,
    startWorkflow,
    updateStage,
    updateStep,
    completeWorkflow,
    handleError,
    getCurrentMessage
  };
};
