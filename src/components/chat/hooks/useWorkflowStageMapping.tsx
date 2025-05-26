
import { useState } from 'react';

/**
 * Hook to handle workflow stage mapping and conversion
 */
export const useWorkflowStageMapping = () => {
  const [processingStage, setProcessingStage] = useState('');

  // Convert processingStage string to proper type
  const getCurrentStep = (): 'preparing' | 'processing' | 'finalizing' | 'reviewing' => {
    if (!processingStage) return 'preparing';
    
    // Map string values to proper types
    switch (processingStage.toLowerCase()) {
      case 'preparing':
      case 'checking cached responses...':
        return 'preparing';
      case 'processing':
      case 'gathering regulatory context...':
      case 'generating response...':
        return 'processing';
      case 'finalizing':
        return 'finalizing';
      case 'reviewing':
        return 'reviewing';
      default:
        return 'preparing';
    }
  };

  return {
    processingStage,
    setProcessingStage,
    getCurrentStep
  };
};
