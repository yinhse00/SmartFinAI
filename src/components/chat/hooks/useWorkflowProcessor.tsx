
import { useState } from 'react';
import { Message } from '../ChatMessage';
import { step1Initial } from './useStep1Initial';
import { step2ListingRules } from './useStep2ListingRules';
import { step3TakeoversCode } from './useStep3TakeoversCode';
import { step4Execution } from './useStep4Execution';
import { step5Response } from './useStep5Response';
import { WorkflowStep, WorkflowProcessorProps, Step1Result } from './workflow/types';
import { useContextRetrieval } from './useContextRetrieval';
import { useLanguageState } from './useLanguageState';
import { useTranslationManager } from './useTranslationManager';

/**
 * Hook for managing the workflow of processing and responding to queries
 * Enhanced with parallel processing capabilities
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
  const [stepProgress, setStepProgress] = useState('');
  
  // Use enhanced context retrieval with parallel processing
  const { retrieveRegulatoryContext } = useContextRetrieval();
  const { lastInputWasChinese, checkIsChineseInput, storeTranslation } = useLanguageState();
  const { manageTranslations } = useTranslationManager();
  
  /**
   * Execute the workflow for a query with enhanced parallel processing
   */
  const executeWorkflow = async (query: string) => {
    if (!isGrokApiKeySet) {
      setApiKeyDialogOpen(true);
      return;
    }
    
    setIsLoading(true);
    setCurrentStep('initial');
    setLastQuery(query);
    
    try {
      // Add user message
      const userMessage: Message = {
        id: Date.now().toString(),
        sender: 'user',
        content: query,
        timestamp: new Date()
      };
      
      const updatedMessages = [...messages, userMessage];
      setMessages(updatedMessages);
      
      // Create assistant message placeholder
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'bot',
        content: '',
        timestamp: new Date(),
        isError: false,
        metadata: {}
      };
      
      setMessages([...updatedMessages, assistantMessage]);
      
      // Step 1: Enhanced Initial Processing with parallel classification
      setCurrentStep('initial');
      const step1Result = await step1Initial({
        query,
        storeTranslation,
        setStepProgress,
        retrieveRegulatoryContext
      });
      
      // Get workflow parameters from step 1 result
      let params: any = { 
        ...step1Result,
        skipSequentialSearches: step1Result.skipSequentialSearches || false
      };
      
      // For parallel processing path, we can often skip to response generation
      let nextStep = step1Result.nextStep;
      
      // If we have comprehensive context from parallel processing, skip sequential steps
      if (params.skipSequentialSearches) {
        console.log('Skipping sequential search steps - using parallel processed context');
        nextStep = 'response';
      } else {
        // If parallel processing didn't yield sufficient context, follow sequential flow
        // Step 2: Listing Rules
        if (nextStep === 'listingRules') {
          setCurrentStep('listingRules');
          const step2Result = await step2ListingRules(params, setStepProgress);
          params = { ...params, ...step2Result };
          nextStep = step2Result.nextStep;
        }
        
        // Step 3: Takeovers Code
        if (nextStep === 'takeoversCode') {
          setCurrentStep('takeoversCode');
          const step3Result = await step3TakeoversCode(params, setStepProgress);
          params = { ...params, ...step3Result };
          nextStep = step3Result.nextStep;
        }
        
        // Step 4: Execution Process
        if (nextStep === 'execution') {
          setCurrentStep('execution');
          const step4Result = await step4Execution(params, setStepProgress);
          params = { ...params, ...step4Result };
          nextStep = step4Result.nextStep;
        }
      }
      
      // Step 5: Response Generation (always required)
      setCurrentStep('response');
      console.log('Starting step 5 with params:', params);
      const step5Result = await step5Response(
        params, 
        setStepProgress,
        lastInputWasChinese
      );
      console.log('Step 5 result:', step5Result);
      
      // Update assistant message with response
      if (step5Result.response) {
        const finalMessages = [...updatedMessages];
        
        // Find and update the assistant message
        const assistantIndex = finalMessages.findIndex(
          (m) => m.id === assistantMessage.id
        );
        
        if (assistantIndex !== -1) {
          console.log('Updating assistant message at index:', assistantIndex);
          console.log('Response content:', step5Result.response.substring(0, 100) + '...');
          
          finalMessages[assistantIndex] = {
            ...assistantMessage,
            content: step5Result.response,
            metadata: step5Result.metadata || {}
          };
          
          setMessages(finalMessages);
          console.log('Messages after update:', finalMessages.map(m => `${m.sender}: ${m.content.substring(0, 30)}...`));
          
          // Handle translations if needed
          if (step5Result.requiresTranslation) {
            manageTranslations(finalMessages, assistantIndex);
          }
        } else {
          console.error('Could not find assistant message to update');
        }
      } else {
        console.error('No response content in step5Result:', step5Result);
      }
      
      setCurrentStep('complete');
    } catch (error) {
      console.error('Workflow error:', error);
      
      // Update messages with error
      const errorMessage = `I encountered an error while processing your request. Please try again.${
        error instanceof Error ? ` (${error.message})` : ''
      }`;
      
      const updatedMessages = [...messages];
      const assistantIndex = updatedMessages.findIndex(
        (m) => m.sender === 'bot' && !m.content
      );
      
      if (assistantIndex !== -1) {
        updatedMessages[assistantIndex] = {
          ...updatedMessages[assistantIndex],
          content: errorMessage,
          isError: true
        };
        
        setMessages(updatedMessages);
      } else {
        // If we can't find the bot message, add a new one
        const errorMsg: Message = {
          id: Date.now().toString(),
          sender: 'bot',
          content: errorMessage,
          timestamp: new Date(),
          isError: true
        };
        
        setMessages([...updatedMessages, errorMsg]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    currentStep,
    stepProgress,
    executeWorkflow
  };
};

