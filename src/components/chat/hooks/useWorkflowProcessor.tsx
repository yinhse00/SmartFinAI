
import { useWorkflowContext } from './workflow/useWorkflowContext';
import { useWorkflowExecution } from './workflow/useWorkflowExecution';
import { WorkflowProcessorProps } from './workflow/types';

/**
 * Main hook that orchestrates the workflow processing
 */
export const useWorkflowProcessor = (props: WorkflowProcessorProps) => {
  const {
    messages,
    setMessages,
    setLastQuery,
    isGrokApiKeySet,
    setApiKeyDialogOpen
  } = props;

  // Get workflow context and state
  const {
    isLoading,
    setIsLoading,
    currentStep,
    setCurrentStep,
    stepProgress,
    setStepProgress,
    errorCount,
    setErrorCount,
    lastInputWasChinese,
    checkIsChineseInput,
    trackStepPerformance,
    createUserMessage
  } = useWorkflowContext(props);
  
  // Get workflow execution function
  const { executeWorkflow } = useWorkflowExecution(
    setMessages,
    createUserMessage,
    setIsLoading,
    setCurrentStep,
    setStepProgress,
    trackStepPerformance,
    setErrorCount,
    errorCount,
    isGrokApiKeySet,
    setApiKeyDialogOpen,
    setLastQuery,
    checkIsChineseInput,
    lastInputWasChinese
  );

  return {
    isLoading,
    currentStep,
    stepProgress,
    executeWorkflow
  };
};
