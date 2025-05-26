
import { useState } from 'react';

interface WorkflowStageMappingProps {
  processingStage: string;
}

/**
 * Hook to handle workflow stage mapping and conversion
 */
export const useWorkflowStageMapping = ({ processingStage }: WorkflowStageMappingProps) => {
  // Convert processingStage string to proper type
  const getCurrentStep = (): 'preparing' | 'processing' | 'finalizing' | 'reviewing' => {
    if (!processingStage) return 'preparing';
    
    // Map string values to proper types
    switch (processingStage.toLowerCase()) {
      case 'preparing':
      case 'checking cached responses...':
      case 'analyzing your query...':
        return 'preparing';
      case 'processing':
      case 'gathering regulatory context...':
      case 'generating response...':
      case 'searching for relevant guidance and listing decisions':
        return 'processing';
      case 'finalizing':
      case 'generating detailed response...':
        return 'finalizing';
      case 'reviewing':
        return 'reviewing';
      default:
        return 'preparing';
    }
  };

  return {
    getCurrentStep
  };
};
