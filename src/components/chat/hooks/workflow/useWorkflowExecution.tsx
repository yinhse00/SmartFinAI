
import { useCallback } from 'react';
import { Message } from '../../ChatMessage';
import { executeStep1 } from './step1Initial';
import { executeStep2 } from './step2ListingRules';
import { executeStep3 } from './step3TakeoversCode';
import { executeStep4 } from './step4Execution';
import { executeStep5 } from './step5Response';
import { useWorkflowError } from './useWorkflowError';
import { useTranslationHandler } from './useTranslationHandler';
import { grokService } from '@/services/grokService';

// Define local interfaces for type safety
interface LocalStep2Result {
  completed: boolean;
  context: string;
  shouldContinue: boolean;
  nextStep: 'initial' | 'listingRules' | 'takeoversCode' | 'execution' | 'response' | 'complete';
  listingRulesSearchNegative: boolean;
  executionRequired?: boolean;
  error?: Error;
}

interface LocalStep3Result {
  completed: boolean;
  context: string;
  shouldContinue: boolean;
  nextStep: 'initial' | 'listingRules' | 'takeoversCode' | 'execution' | 'response' | 'complete';
  takeoversCodeSearchNegative: boolean;
  executionRequired?: boolean;
  error?: Error;
}

interface LocalStep4Result {
  completed: boolean;
  context: string;
  executionContext: string;
  error?: Error;
}

export const useWorkflowExecution = (
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>,
  createUserMessage: (queryText: string) => Message,
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>,
  setCurrentStep: React.Dispatch<React.SetStateAction<'initial' | 'listingRules' | 'takeoversCode' | 'execution' | 'response' | 'complete'>>,
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
  const { translateContent } = useTranslationHandler();

  // Main workflow execution function
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
      const userMessage = createUserMessage(query);
      setMessages(prevMessages => [...prevMessages, userMessage]);
      
      // Step 1.2.1: Check if input is Chinese and translate if needed
      let processedQuery = query;
      const isChinese = checkIsChineseInput(query);
      
      if (isChinese) {
        setStepProgress('Translating Chinese input to English');
        try {
          const translatedQuery = await translateContent(query, true);
          if (translatedQuery) {
            processedQuery = translatedQuery;
            console.log('Translated query:', processedQuery);
          }
        } catch (translationError) {
          console.error('Translation error:', translationError);
          // Continue with original query if translation fails
        }
      }
      
      // Step 1.3 & 1.4: Initial query analysis 
      setCurrentStep('initial');
      setStepProgress('Analyzing your query');
      
      const step1Result = await executeStep1(
        { query: processedQuery },
        setStepProgress
      );
      
      trackStepPerformance('initial', stepStartTime);
      stepStartTime = performance.now();

      if (!step1Result.completed) {
        throw new Error('Failed at step 1: ' + (step1Result.error?.message || 'Unknown error'));
      }

      // Step 2: If Grok's analysis is related to Listing Rules
      // Conditionally run Step 2 based on query analysis
      let step2Result: LocalStep2Result = {
        completed: false,
        context: '',
        shouldContinue: true,
        nextStep: 'takeoversCode',
        listingRulesSearchNegative: true
      };
      
      if (step1Result.isRegulatoryRelated) {
        setCurrentStep('listingRules');
        setStepProgress('Checking listing rules for relevant information');
        
        const rawStep2Result = await executeStep2(
          { 
            query: processedQuery,
            initialContext: step1Result.context || '',
            queryType: step1Result.queryType || 'general'
          },
          setStepProgress
        );
        
        // Ensure required properties exist
        step2Result = {
          ...rawStep2Result,
          context: rawStep2Result.context || '',
          shouldContinue: rawStep2Result.shouldContinue !== undefined ? rawStep2Result.shouldContinue : true,
          error: rawStep2Result.error
        } as LocalStep2Result;
        
        trackStepPerformance('listingRules', stepStartTime);
        stepStartTime = performance.now();

        if (!step2Result.completed) {
          throw new Error('Failed at step 2: ' + (step2Result.error?.message || 'Unknown error'));
        }
      }

      // Step 3: If Grok's analysis is related to Takeovers Code or Step 2 was negative
      let step3Result: LocalStep3Result = {
        completed: false,
        context: '',
        shouldContinue: true,
        nextStep: 'execution',
        takeoversCodeSearchNegative: true
      };
      
      if (!step1Result.isRegulatoryRelated || step2Result.listingRulesSearchNegative) {
        setCurrentStep('takeoversCode');
        setStepProgress('Analyzing takeovers code regulations');
        
        const rawStep3Result = await executeStep3(
          {
            query: processedQuery,
            initialContext: step1Result.context || '',
            listingRulesContext: step2Result.context || '',
            queryType: step1Result.queryType || 'general'
          },
          setStepProgress
        );
        
        // Ensure required properties exist
        step3Result = {
          ...rawStep3Result,
          context: rawStep3Result.context || '',
          shouldContinue: rawStep3Result.shouldContinue !== undefined ? rawStep3Result.shouldContinue : true,
          error: rawStep3Result.error
        } as LocalStep3Result;
        
        trackStepPerformance('takeoversCode', stepStartTime);
        stepStartTime = performance.now();

        if (!step3Result.completed) {
          throw new Error('Failed at step 3: ' + (step3Result.error?.message || 'Unknown error'));
        }
      }

      // Step 4: Execution planning - only if needed based on previous steps
      let step4Result: LocalStep4Result = {
        completed: true,
        context: step3Result.context || step2Result.context || step1Result.context || '',
        executionContext: ''
      };
      
      const needsExecution = step3Result.executionRequired || step2Result.executionRequired;
      
      if (needsExecution) {
        setCurrentStep('execution');
        setStepProgress('Creating execution plan for your query');
        
        const rawStep4Result = await executeStep4(
          {
            query: processedQuery,
            initialContext: step1Result.context || '',
            listingRulesContext: step2Result.context || '',
            takeoversCodeContext: step3Result.context || '',
            queryType: step1Result.queryType || 'general'
          },
          setStepProgress
        );
        
        // Ensure required properties exist
        step4Result = {
          ...rawStep4Result,
          context: rawStep4Result.context || '',
          executionContext: rawStep4Result.executionContext || '',
          error: rawStep4Result.error
        } as LocalStep4Result;
        
        trackStepPerformance('execution', stepStartTime);
        stepStartTime = performance.now();

        if (!step4Result.completed) {
          throw new Error('Failed at step 4: ' + (step4Result.error?.message || 'Unknown error'));
        }
      }

      // Step 5: Response generation
      setCurrentStep('response');
      setStepProgress('Generating final response');
      
      const step5Result = await executeStep5(
        {
          query: processedQuery,
          regulatoryContext: step4Result.context || '',
          executionContext: step4Result.executionContext || '',
          listingRulesContext: step2Result.context || '', 
          takeoversCodeContext: step3Result.context || '',
          queryType: step1Result.queryType || 'general',
          originalLanguageWasChinese: isChinese
        },
        setStepProgress,
        lastInputWasChinese || isChinese
      );
      
      trackStepPerformance('response', stepStartTime);

      if (!step5Result.completed) {
        throw new Error('Failed at step 5: ' + (step5Result.error?.message || 'Unknown error'));
      }

      // Process the response
      setCurrentStep('complete');
      
      // Create bot message with the correct type from the beginning
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: step5Result.requiresTranslation ? step5Result.translatedResponse || '' : step5Result.response || '',
        sender: 'bot',
        timestamp: new Date(),
      };
      
      // Only add metadata if it exists in step5Result
      if (step5Result.metadata) {
        botMessage.metadata = step5Result.metadata;
      }
      
      setMessages(prevMessages => [...prevMessages, botMessage]);

      // Reset error count on successful completion
      if (errorCount > 0) {
        setErrorCount(0);
      }

      // Log overall performance
      const totalDuration = performance.now() - workflowStartTime;
      console.log(`Total workflow completed in ${totalDuration}ms`);

    } catch (error) {
      console.error('Workflow execution error:', error);
      
      // Track error count for potential fallback handling
      setErrorCount(prev => prev + 1);
      
      // Add error message to chat
      const errorMessage = handleWorkflowError(error, errorCount, []);
      
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
    lastInputWasChinese,
    checkIsChineseInput,
    createUserMessage,
    setIsLoading,
    setCurrentStep,
    setStepProgress,
    setErrorCount,
    handleWorkflowError,
    translateContent
  ]);

  return {
    executeWorkflow
  };
};
