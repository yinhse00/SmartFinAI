
import { useState } from 'react';
import { WorkflowStep } from './types';
import { Message } from '../../ChatMessage';
import { useWorkflowError } from './useWorkflowError';
import { executeStep1 } from './step1Classification';
import { executeStep2 } from './step2ListingRules';
import { executeStep3 } from './step3TakeoverRules';
import { executeStep4 } from './step4Execution';
import { executeResponse } from './executeResponse';

export const useWorkflowExecution = (
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>,
  createUserMessage: (queryText: string) => Message,
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>,
  setCurrentStep: React.Dispatch<React.SetStateAction<WorkflowStep>>,
  setStepProgress: React.Dispatch<React.SetStateAction<string>>,
  trackStepPerformance: (step: string, startTime: number) => void,
  setErrorCount: React.Dispatch<React.SetStateAction<number>>,
  errorCount: number,
  isGrokApiKeySet: boolean,
  setApiKeyDialogOpen: React.Dispatch<React.SetStateAction<boolean>>,
  setLastQuery: React.Dispatch<React.SetStateAction<string>>,
  checkIsChineseInput: (text: string) => boolean,
  lastInputWasChinese: boolean
) => {
  const { handleWorkflowError } = useWorkflowError();
  
  const executeWorkflow = async (queryText: string) => {
    console.log('Starting workflow execution for query:', queryText);
    
    // Set loading state
    setIsLoading(true);
    
    // Check if API key is set
    if (!isGrokApiKeySet) {
      setApiKeyDialogOpen(true);
      setIsLoading(false);
      return;
    }
    
    // Add the user message to the chat
    const userMessage = createUserMessage(queryText);
    setMessages(prev => [...prev, userMessage]);
    
    // Save query for potential retry
    setLastQuery(queryText);
    
    try {
      // Initialize workflow params
      let params: any = { query: queryText };
      console.log('Initial params:', params);
      
      // Step 1: Classification
      setCurrentStep('initial');
      setStepProgress('Classifying query...');
      const step1StartTime = performance.now();
      
      try {
        const step1Result = await executeStep1({ query: queryText });
        trackStepPerformance('classification', step1StartTime);
        
        if (!step1Result.completed) {
          throw new Error('Classification step failed');
        }
        
        params = { ...params, ...step1Result };
        console.log('After step 1:', params);
        
        if (!step1Result.shouldContinue) {
          // Skip to response generation
          params.skipToResponse = true;
        }
      } catch (error) {
        console.error('Error in step 1:', error);
        params.skipToResponse = true;
      }
      
      // Step 2: Listing Rules Context (if needed)
      if (!params.skipToResponse && params.nextStep === 'listingRules') {
        setCurrentStep('listingRules');
        setStepProgress('Retrieving Listing Rules...');
        const step2StartTime = performance.now();
        
        try {
          const step2Result = await executeStep2(params);
          trackStepPerformance('listingRules', step2StartTime);
          
          params = { 
            ...params, 
            ...step2Result, 
            listingRulesSearchNegative: !step2Result.completed || step2Result.context === ''
          };
          console.log('After step 2:', params);
        } catch (error) {
          console.error('Error in step 2:', error);
          params.listingRulesSearchNegative = true;
          if (error instanceof Error) {
            params.error = error.message;
          }
        }
      }
      
      // Step 3: Takeovers Code Context (if needed)
      if (!params.skipToResponse && params.nextStep === 'takeoversCode') {
        setCurrentStep('takeoversCode');
        setStepProgress('Retrieving Takeovers Code...');
        const step3StartTime = performance.now();
        
        try {
          const step3Result = await executeStep3(params);
          trackStepPerformance('takeoversCode', step3StartTime);
          
          params = { 
            ...params, 
            ...step3Result,
            takeoversCodeSearchNegative: !step3Result.completed || !step3Result.context
          };
          console.log('After step 3:', params);
        } catch (error) {
          console.error('Error in step 3:', error);
          params.takeoversCodeSearchNegative = true;
          if (error instanceof Error) {
            params.error = error.message;
          }
        }
      }
      
      // Step 4: Execution Guidance (if needed)
      const executionRequired = 
        params.query.toLowerCase().includes('timetable') || 
        params.query.toLowerCase().includes('timeline') ||
        params.query.toLowerCase().includes('schedule') ||
        params.query.toLowerCase().includes('process') ||
        params.query.toLowerCase().includes('execution') ||
        params.query.toLowerCase().includes('steps') ||
        params.query.toLowerCase().includes('implement');
        
      if (!params.skipToResponse && (params.nextStep === 'execution' || executionRequired)) {
        setCurrentStep('execution');
        setStepProgress('Retrieving execution guidance...');
        const step4StartTime = performance.now();
        
        try {
          const step4Result = await executeStep4(params, setStepProgress);
          trackStepPerformance('executionGuidance', step4StartTime);
          
          params = { 
            ...params, 
            ...step4Result
          };
          console.log('After step 4:', params);
        } catch (error) {
          console.error('Error in step 4:', error);
          if (error instanceof Error) {
            params.error = error.message;
          }
        }
      }
      
      // Final Step: Generate Response
      setCurrentStep('response');
      setStepProgress('Generating response...');
      const responseStartTime = performance.now();
      
      try {
        const responseResult = await executeResponse(
          params, 
          setMessages, 
          setStepProgress, 
          lastInputWasChinese
        );
        trackStepPerformance('response', responseStartTime);
        console.log('Response generated successfully');
      } catch (error) {
        console.error('Error generating response:', error);
        
        // Create error message
        const errorMessage = handleWorkflowError(error, errorCount, []);
        
        setMessages(prev => [...prev, errorMessage]);
        setErrorCount(prev => prev + 1);
      }
      
      // Complete the workflow
      setCurrentStep('complete');
      
    } catch (error) {
      console.error('Workflow execution error:', error);
      
      // Create error message
      const errorMessage = handleWorkflowError(error, errorCount, []);
      setMessages(prev => [...prev, errorMessage]);
      setErrorCount(prev => prev + 1);
    } finally {
      setIsLoading(false);
      setStepProgress('');
    }
  };
  
  return { executeWorkflow };
};
