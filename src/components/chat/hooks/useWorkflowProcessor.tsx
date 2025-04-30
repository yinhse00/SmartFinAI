
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
      // Step 1: Initial Processing - Input analysis, language detection, file processing
      setCurrentStep('initial');
      const step1Result = await executeStep1(
        queryText, 
        storeTranslation, 
        setStepProgress,
        retrieveRegulatoryContext
      );
      
      // Based on the regulatory relevance, determine next step
      if (!step1Result.shouldContinue) {
        if (step1Result.nextStep === 'response') {
          // Skip to response for non-regulatory questions
          setCurrentStep('response');
          const responseResult = await executeStep5(
            {
              query: step1Result.query,
              isRegulatoryRelated: step1Result.isRegulatoryRelated
            },
            setStepProgress,
            lastInputWasChinese
          );
          
          // Create bot response message
          const botMessage: Message = {
            id: Date.now().toString(),
            content: responseResult.translatedResponse || responseResult.response || 'Sorry, I could not generate a response.',
            sender: 'bot',
            timestamp: new Date()
          };
          
          setMessages([...updatedMessages, botMessage]);
          setIsLoading(false);
          return;
        }
      }
      
      // Execute workflow steps based on analysis
      let nextStep: WorkflowStep = step1Result.nextStep;
      let currentParams = { ...step1Result };
      let stepResult: StepResult | undefined;
      
      // Process through the workflow steps
      while (nextStep !== 'complete') {
        switch (nextStep) {
          // Step 2: Listing Rules Analysis
          case 'listingRules':
            setCurrentStep('listingRules');
            stepResult = await executeStep2(currentParams, setStepProgress);
            break;
            
          // Step 3: Takeovers Code Analysis
          case 'takeoversCode':
            setCurrentStep('takeoversCode');
            stepResult = await executeStep3(currentParams, setStepProgress);
            break;
            
          // Step 4: Execution Guidance (documents, plans, timetables)
          case 'execution':
            setCurrentStep('execution');
            stepResult = await executeStep4(currentParams, setStepProgress);
            break;
            
          // Step 5: Response Generation and Translation if needed
          case 'response':
            setCurrentStep('response');
            stepResult = await executeStep5(currentParams, setStepProgress, lastInputWasChinese);
            
            // Create structured response data
            const structuredResponseData = {
              rulesAnalysis: stepResult.response || '',
              documentsChecklist: stepResult.documentsChecklist || undefined,
              executionPlan: stepResult.executionPlan || undefined,
              executionTimetable: stepResult.executionTimetable || undefined,
            };
            
            // Create formatted content
            let finalContent = stepResult.translatedResponse || stepResult.response || 'Sorry, I could not generate a response.';
            
            // Add structured data as metadata
            const botMessage: Message = {
              id: Date.now().toString(),
              content: finalContent,
              sender: 'bot',
              timestamp: new Date(),
              metadata: {
                structuredResponseData,
                mayRequireBatching: stepResult.metadata?.mayRequireBatching
              }
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
