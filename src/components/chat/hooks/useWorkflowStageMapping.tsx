
import { useState, useEffect } from 'react';
import { workflowStateManager, WorkflowState } from '../workflow/workflowStateManager';
import { WorkflowPhase } from '../workflow/workflowConfig';

interface WorkflowStageMappingProps {
  processingStage: string;
}

/**
 * Enhanced hook using dynamic workflow state management
 */
export const useWorkflowStageMapping = ({ processingStage }: WorkflowStageMappingProps) => {
  const [workflowState, setWorkflowState] = useState<WorkflowState>(
    workflowStateManager.getCurrentState()
  );

  // Subscribe to workflow state changes
  useEffect(() => {
    const unsubscribe = workflowStateManager.subscribe((state) => {
      setWorkflowState(state);
    });

    return unsubscribe;
  }, []);

  // Update workflow state based on processing stage
  useEffect(() => {
    if (processingStage) {
      workflowStateManager.updateFromStageMessage(processingStage);
    }
  }, [processingStage]);

  const getCurrentStep = (): WorkflowPhase => {
    return workflowState.currentPhase;
  };

  // Check if workflow is active based on dynamic state
  const isWorkflowActive = (): boolean => {
    return workflowState.currentPhase !== WorkflowPhase.COMPLETE && workflowState.progress > 0;
  };

  return {
    getCurrentStep,
    isWorkflowActive,
    workflowState
  };
};
