
import { useState } from 'react';
import { Message } from '../ChatMessage';
import { useQueryCore } from './useQueryCore';
import { useLanguageState } from './useLanguageState';
import { useContextRetrieval } from './useContextRetrieval';
import { StepResult, WorkflowProcessorProps, WorkflowStep } from './workflow/types';
import { executeStep1 } from './workflow/step1Initial';
import { executeStep2 } from './workflow/step2ListingRules';
import { executeStep3 } from './workflow/step3TakeoversCode';
import { executeStep4 } from './workflow/step4Execution';
import { executeStep5 } from './workflow/step5Response';

/**
 * Hook that implements the new structured workflow process
 */
export const useWorkflowProcessor = ({
  messages,
  setMessages,
  setLastQuery,
  isGrokApiKeySet,
  setApiKeyDialogOpen
}: WorkflowProcessorProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState<WorkflowStep>('initial');
  const [stepProgress, setStepProgress] = useState<string>('');
  
  const { createUserMessage, handleProcessingError } = useQueryCore(setMessages, isGrokApiKeySet, setApiKeyDialogOpen);
  const { lastInputWasChinese, storeTranslation } = useLanguageState();
  const { retrieveRegulatoryContext } = useContextRetrieval();

  /**
   * Main workflow execution that orchestrates all steps
   */
  const executeWorkflow = async (queryText: string) => {
    if (!queryText.trim()) return;
    
    if (!isGrokApiKeySet) {
      setApiKeyDialogOpen(true);
      return;
    }
    
    setLastQuery(queryText);
    const updatedMessages = createUserMessage(queryText, messages);
    setMessages(updatedMessages);
    
    setIsLoading(true);
    
    try {
      // Step 1: Initial Processing
      setCurrentStep('initial');
      const step1Result = await executeStep1(
        queryText, 
        storeTranslation, 
        setStepProgress,
        retrieveRegulatoryContext
      );
      
      if (!step1Result.shouldContinue) {
        if (step1Result.nextStep === 'response') {
          // Generate response with minimal context
          setCurrentStep('response');
          const responseResult = await executeStep5(
            {
              query: step1Result.query,
              isRegulatoryRelated: step1Result.isRegulatoryRelated
            },
            setStepProgress,
            lastInputWasChinese
          );
          
          const botMessage: Message = {
            id: Date.now().toString(),
            content: responseResult.response || 'Sorry, I could not generate a response.',
            sender: 'bot',
            timestamp: new Date()
          };
          
          setMessages([...updatedMessages, botMessage]);
          setIsLoading(false);
          return;
        }
      }
      
      // Determine next step based on Step 1 result
      let nextStep: WorkflowStep = step1Result.nextStep;
      let currentParams = { ...step1Result };
      let stepResult: StepResult | undefined;
      
      // Execute subsequent steps based on the workflow
      while (nextStep !== 'complete') {
        switch (nextStep) {
          case 'listingRules':
            setCurrentStep('listingRules');
            stepResult = await executeStep2(currentParams, setStepProgress);
            break;
            
          case 'takeoversCode':
            setCurrentStep('takeoversCode');
            stepResult = await executeStep3(currentParams, setStepProgress);
            break;
            
          case 'execution':
            setCurrentStep('execution');
            stepResult = await executeStep4(currentParams, setStepProgress);
            break;
            
          case 'response':
            setCurrentStep('response');
            stepResult = await executeStep5(currentParams, setStepProgress, lastInputWasChinese);
            
            // Create bot response message
            const botMessage: Message = {
              id: Date.now().toString(),
              content: stepResult.response || 'Sorry, I could not generate a response.',
              sender: 'bot',
              timestamp: new Date()
            };
            
            setMessages([...updatedMessages, botMessage]);
            nextStep = 'complete';
            break;
            
          default:
            nextStep = 'complete';
            break;
        }
        
        if (stepResult && stepResult.nextStep && nextStep !== 'complete') {
          nextStep = stepResult.nextStep;
          currentParams = { ...currentParams, ...stepResult };
        } else if (nextStep !== 'complete') {
          nextStep = 'response';
        }
      }
      
    } catch (error) {
      handleProcessingError(error, updatedMessages);
    } finally {
      setIsLoading(false);
      setCurrentStep('initial');
      setStepProgress('');
    }
  };

  return {
    isLoading,
    currentStep,
    stepProgress,
    executeWorkflow
  };
};
