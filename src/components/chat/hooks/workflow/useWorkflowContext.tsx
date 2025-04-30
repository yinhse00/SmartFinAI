
import { useState, useCallback } from 'react';
import { Message } from '../../ChatMessage';
import { WorkflowProcessorProps, WorkflowStep } from './types';
import { useLanguageState } from '../useLanguageState';

export const useWorkflowContext = ({
  messages,
  setMessages,
  setLastQuery,
  isGrokApiKeySet,
  setApiKeyDialogOpen
}: WorkflowProcessorProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState<WorkflowStep>('initial');
  const [stepProgress, setStepProgress] = useState('');
  const [errorCount, setErrorCount] = useState(0);
  const { lastInputWasChinese, checkIsChineseInput } = useLanguageState();
  
  // Track performance metrics
  const [stepTimings, setStepTimings] = useState<Record<string, number>>({});
  
  // Performance tracking
  const trackStepPerformance = useCallback((step: string, startTime: number) => {
    const duration = performance.now() - startTime;
    console.log(`Step ${step} completed in ${duration}ms`);
    setStepTimings(prev => ({
      ...prev,
      [step]: duration
    }));
  }, []);

  // Create a user message for the query
  const createUserMessage = (queryText: string): Message => {
    return {
      id: Date.now().toString(),
      content: queryText,
      sender: 'user',
      timestamp: new Date(),
    };
  };

  return {
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
    stepTimings,
    trackStepPerformance,
    createUserMessage
  };
};
