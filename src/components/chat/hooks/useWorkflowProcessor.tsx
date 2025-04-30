
import { useState, useCallback } from 'react';
import { executeStep1 } from './workflow/step1Initial';
import { executeStep2 } from './workflow/step2ListingRules';
import { executeStep3 } from './workflow/step3TakeoversCode';
import { executeStep4 } from './workflow/step4Execution';
import { executeStep5 } from './workflow/step5Response';
import { useLanguageState } from './useLanguageState';
import { StepResult, WorkflowProcessorProps } from './workflow/types';
import { Message } from '../ChatMessage';

export const useWorkflowProcessor = ({
  messages,
  setMessages,
  setLastQuery,
  isGrokApiKeySet,
  setApiKeyDialogOpen
}: WorkflowProcessorProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState<'initial' | 'listingRules' | 'takeoversCode' | 'execution' | 'response' | 'complete'>('initial');
  const [stepProgress, setStepProgress] = useState('');
  const [errorCount, setErrorCount] = useState(0);
  const { lastInputWasChinese } = useLanguageState();

  // Track performance metrics
  const [stepTimings, setStepTimings] = useState<Record<string, number>>({});
  
  // Add performance tracking
  const trackStepPerformance = useCallback((step: string, startTime: number) => {
    const duration = performance.now() - startTime;
    console.log(`Step ${step} completed in ${duration}ms`);
    setStepTimings(prev => ({
      ...prev,
      [step]: duration
    }));
  }, []);

  const executeWorkflow = useCallback(async (query: string) => {
    if (!isGrokApiKeySet) {
      console.log('No API key set, opening API key dialog');
      setApiKeyDialogOpen(true);
      return;
    }

    setIsLoading(true);
    setCurrentStep('initial');
    setLastQuery(query);
    setStepProgress('Starting workflow');
    
    const workflowStartTime = performance.now();
    let stepStartTime = performance.now();

    try {
      // Pre-processing: add user message immediately for better UX
      const userMessage: Message = {
        id: Date.now().toString(),
        content: query,
        sender: 'user',
        timestamp: new Date(),
      };
      
      setMessages(prevMessages => [...prevMessages, userMessage]);

      // Step 1: Initial query analysis
      setCurrentStep('initial');
      setStepProgress('Analyzing your query');
      
      const step1Result = await executeStep1(
        { query },
        setStepProgress
      );
      
      trackStepPerformance('initial', stepStartTime);
      stepStartTime = performance.now();

      if (!step1Result.completed) {
        throw new Error('Failed at step 1: ' + (step1Result.error?.message || 'Unknown error'));
      }

      // Step 2: Listing rules context
      setCurrentStep('listingRules');
      setStepProgress('Checking listing rules for relevant information');
      
      const step2Result = await executeStep2(
        { 
          query,
          initialContext: step1Result.context || '',
          queryType: step1Result.queryType || 'general'
        },
        setStepProgress
      );
      
      trackStepPerformance('listingRules', stepStartTime);
      stepStartTime = performance.now();

      if (!step2Result.completed) {
        throw new Error('Failed at step 2: ' + (step2Result.error?.message || 'Unknown error'));
      }

      // Step 3: Takeovers code context
      setCurrentStep('takeoversCode');
      setStepProgress('Analyzing takeovers code regulations');
      
      const step3Result = await executeStep3(
        {
          query,
          initialContext: step1Result.context || '',
          listingRulesContext: step2Result.context || '',
          queryType: step1Result.queryType || 'general'
        },
        setStepProgress
      );
      
      trackStepPerformance('takeoversCode', stepStartTime);
      stepStartTime = performance.now();

      if (!step3Result.completed) {
        throw new Error('Failed at step 3: ' + (step3Result.error?.message || 'Unknown error'));
      }

      // Step 4: Execution planning
      setCurrentStep('execution');
      setStepProgress('Creating execution plan for your query');
      
      const step4Result = await executeStep4(
        {
          query,
          initialContext: step1Result.context || '',
          listingRulesContext: step2Result.context || '',
          takeoversCodeContext: step3Result.context || '',
          queryType: step1Result.queryType || 'general'
        },
        setStepProgress
      );
      
      trackStepPerformance('execution', stepStartTime);
      stepStartTime = performance.now();

      if (!step4Result.completed) {
        throw new Error('Failed at step 4: ' + (step4Result.error?.message || 'Unknown error'));
      }

      // Step 5: Response generation
      setCurrentStep('response');
      setStepProgress('Generating final response');
      
      const step5Result = await executeStep5(
        {
          query,
          regulatoryContext: step4Result.context || '',
          executionContext: step4Result.executionContext || '',
          listingRulesContext: step2Result.context || '', 
          takeoversCodeContext: step3Result.context || '',
          queryType: step1Result.queryType || 'general'
        },
        setStepProgress,
        lastInputWasChinese
      );
      
      trackStepPerformance('response', stepStartTime);

      if (!step5Result.completed) {
        throw new Error('Failed at step 5: ' + (step5Result.error?.message || 'Unknown error'));
      }

      // Process the response
      setCurrentStep('complete');
      
      // Create bot message
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: step5Result.requiresTranslation ? step5Result.translatedResponse || '' : step5Result.response || '',
        sender: 'bot',
        timestamp: new Date(),
        metadata: step5Result.metadata || {}
      };
      
      setMessages(prevMessages => [...prevMessages, botMessage]);

      // Reset error count on successful completion
      if (errorCount > 0) {
        setErrorCount(0);
      }

      // Log overall performance
      const totalDuration = performance.now() - workflowStartTime;
      console.log(`Total workflow completed in ${totalDuration}ms`);
      console.log('Step timings:', stepTimings);

    } catch (error) {
      console.error('Workflow execution error:', error);
      
      // Track error count for potential fallback handling
      setErrorCount(prev => prev + 1);
      
      // Add error message to chat
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: errorCount >= 2 
          ? "I encountered multiple errors processing your request. I'll use a simplified approach to answer your question."
          : "I apologize, but I had trouble processing your request. Could you try rephrasing your question?",
        sender: 'bot',
        timestamp: new Date(),
        isError: true
      };
      
      setMessages(prevMessages => [...prevMessages, errorMessage]);
      
    } finally {
      setIsLoading(false);
      setCurrentStep('complete');
      setStepProgress('');
    }
  }, [
    isGrokApiKeySet, 
    setApiKeyDialogOpen, 
    setLastQuery, 
    setMessages, 
    errorCount, 
    trackStepPerformance, 
    stepTimings,
    lastInputWasChinese
  ]);

  return {
    isLoading,
    currentStep,
    stepProgress,
    executeWorkflow
  };
};
