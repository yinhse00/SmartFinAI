
import { useState } from 'react';

export type WorkflowCurrentStep = 'preparing' | 'processing' | 'finalizing' | 'reviewing';

export const useWorkflowState = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [processingStage, setProcessingStage] = useState('');
  const [currentStep, setCurrentStep] = useState<WorkflowCurrentStep>('preparing');

  const startWorkflow = () => {
    setIsLoading(true);
    setCurrentStep('preparing');
    setProcessingStage('');
  };

  const updateStage = (stage: string) => {
    setProcessingStage(stage);
  };

  const updateStep = (step: WorkflowCurrentStep) => {
    setCurrentStep(step);
  };

  const completeWorkflow = () => {
    setCurrentStep('reviewing');
    setProcessingStage('Response complete - High quality validated');
    
    setTimeout(() => {
      setProcessingStage('Complete');
      setTimeout(() => {
        setIsLoading(false);
        setProcessingStage('');
        setCurrentStep('preparing');
      }, 1500);
    }, 1000);
  };

  const handleError = () => {
    setIsLoading(false);
    setProcessingStage('');
    setCurrentStep('preparing');
  };

  return {
    isLoading,
    processingStage,
    currentStep,
    startWorkflow,
    updateStage,
    updateStep,
    completeWorkflow,
    handleError
  };
};
