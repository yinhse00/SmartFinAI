
import { useState } from 'react';
import { Message } from '../ChatMessage';
import { useQueryCore } from './useQueryCore';
import { useLanguageState } from './useLanguageState';
import { useContextRetrieval } from './useContextRetrieval';
import { grokService } from '@/services/grokService';

/**
 * Hook that implements the new structured workflow process
 */
export const useWorkflowProcessor = (
  messages: Message[],
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>,
  setLastQuery: React.Dispatch<React.SetStateAction<string>>,
  isGrokApiKeySet: boolean,
  setApiKeyDialogOpen: React.Dispatch<React.SetStateAction<boolean>>
) => {
  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState<'initial' | 'listingRules' | 'takeoversCode' | 'execution' | 'response'>('initial');
  const [stepProgress, setStepProgress] = useState<string>('');
  
  const { createUserMessage, handleProcessingError } = useQueryCore(setMessages, isGrokApiKeySet, setApiKeyDialogOpen);
  const { lastInputWasChinese, checkIsChineseInput, storeTranslation } = useLanguageState();
  const { retrieveRegulatoryContext } = useContextRetrieval();

  /**
   * Step 1: Initial Processing
   * - Receives user question
   * - Detects language and translates if Chinese
   * - Initial analysis by Grok
   * - Determines if regulatory-related
   */
  const executeStep1 = async (queryText: string) => {
    setCurrentStep('initial');
    setStepProgress('Receiving query and performing initial analysis');
    
    // Step 1(c): Check if input is Chinese and needs translation
    const isChinese = checkIsChineseInput(queryText);
    let processedQuery = queryText;
    
    if (isChinese) {
      setStepProgress('Translating Chinese query to English');
      try {
        // Translate Chinese to English for processing
        const translation = await grokService.translateContent(queryText, 'en');
        processedQuery = translation.text;
        storeTranslation(queryText, processedQuery);
        console.log('Translated query:', processedQuery);
      } catch (error) {
        console.error('Translation error:', error);
        // Continue with original text if translation fails
      }
    }

    // Step 1(d-e): Process query with Grok and check if regulatory-related
    setStepProgress('Analyzing query relevance to financial regulations');
    
    try {
      // Check if query is related to Listing Rules or Takeovers Code
      const { regulatoryContext, reasoning } = await retrieveRegulatoryContext(processedQuery);
      
      // Step 1(f): If not related to regulations, skip to response
      if (!regulatoryContext || regulatoryContext.trim() === '') {
        console.log('Query not related to financial regulations, skipping to response');
        return { 
          shouldContinue: false, 
          nextStep: 'response', 
          query: processedQuery,
          isRegulatoryRelated: false
        };
      }
      
      // Determine if Listing Rules or Takeovers Code related
      const isListingRulesRelated = 
        regulatoryContext.toLowerCase().includes('listing rules') ||
        regulatoryContext.toLowerCase().includes('chapter');
        
      const isTakeoversCodeRelated =
        regulatoryContext.toLowerCase().includes('takeovers code') ||
        regulatoryContext.toLowerCase().includes('takeover') ||
        regulatoryContext.toLowerCase().includes('general offer');
      
      // Decide on next step based on content relevance
      let nextStep: 'listingRules' | 'takeoversCode' | 'response' = 'response';
      
      if (isListingRulesRelated) {
        nextStep = 'listingRules';
      } else if (isTakeoversCodeRelated) {
        nextStep = 'takeoversCode';
      }
      
      return {
        shouldContinue: true,
        nextStep,
        query: processedQuery,
        regulatoryContext,
        reasoning,
        isRegulatoryRelated: true,
        isListingRulesRelated,
        isTakeoversCodeRelated
      };
    } catch (error) {
      console.error('Error in step 1:', error);
      return { 
        shouldContinue: false, 
        nextStep: 'response', 
        query: processedQuery,
        error
      };
    }
  };

  /**
   * Step 2: Listing Rules Search
   * - Search in Summary and Keyword Index
   * - Query related chapters if match found
   * - Check if also Takeovers Code related
   */
  const executeStep2 = async (params: any) => {
    setCurrentStep('listingRules');
    setStepProgress('Searching Listing Rules summary and keyword index');
    
    try {
      // Step 2(a): Search Summary and Keyword Index for Listing Rules
      const response = await grokService.getRegulatoryContext(
        `Search specifically in "Summary and Keyword Index_Listing Rule.docx" for: ${params.query}`
      );
      
      const listingRulesContext = response.text || '';
      const reasoning = '';
      
      // Step 2(b-c): Check if search was positive or negative
      const searchPositive = listingRulesContext && listingRulesContext.trim() !== '';
      
      if (searchPositive) {
        setStepProgress('Found relevant Listing Rules, retrieving chapter details');
        
        // Search in related Chapter of Listing Rules
        const chapterMatch = listingRulesContext.match(/Chapter\s+(\d+[A-Z]?)/i);
        let enhancedContext = listingRulesContext;
        
        if (chapterMatch && chapterMatch[1]) {
          const chapterNum = chapterMatch[1];
          const chapterResponse = await grokService.getRegulatoryContext(
            `Find detailed information about Chapter ${chapterNum} of the Listing Rules`
          );
          
          const chapterContext = chapterResponse.text || '';
          
          if (chapterContext) {
            enhancedContext += "\n\n--- Detailed Chapter Information ---\n\n" + chapterContext;
          }
        }
        
        // Step 2(d): Check if also related to Takeovers Code
        const takeoverRelated = 
          enhancedContext.toLowerCase().includes('takeover') ||
          enhancedContext.toLowerCase().includes('general offer') ||
          enhancedContext.toLowerCase().includes('mandatory offer');
        
        if (takeoverRelated) {
          return {
            shouldContinue: true,
            nextStep: 'takeoversCode',
            query: params.query,
            listingRulesContext: enhancedContext,
            takeoversCodeRelated: true
          };
        }
        
        // Check if execution guidance is needed
        const executionRequired = 
          params.query.toLowerCase().includes('process') ||
          params.query.toLowerCase().includes('how to') ||
          params.query.toLowerCase().includes('steps') ||
          params.query.toLowerCase().includes('procedure') ||
          params.query.toLowerCase().includes('timeline') ||
          params.query.toLowerCase().includes('timetable');
          
        if (executionRequired) {
          return {
            shouldContinue: true,
            nextStep: 'execution',
            query: params.query,
            listingRulesContext: enhancedContext,
            executionRequired: true
          };
        }
        
        return {
          shouldContinue: true,
          nextStep: 'response',
          query: params.query,
          listingRulesContext: enhancedContext,
          regulatoryContext: enhancedContext,
          executionRequired: false
        };
      } else {
        // Negative search result - move to Step 4 or 5 depending on execution needs
        setStepProgress('No specific Listing Rules found, checking if execution guidance is needed');
        
        const executionRequired = 
          params.query.toLowerCase().includes('process') ||
          params.query.toLowerCase().includes('how to') ||
          params.query.toLowerCase().includes('steps') ||
          params.query.toLowerCase().includes('procedure') ||
          params.query.toLowerCase().includes('timeline') ||
          params.query.toLowerCase().includes('timetable');
          
        if (executionRequired) {
          return {
            shouldContinue: true,
            nextStep: 'execution',
            query: params.query,
            executionRequired: true
          };
        }
        
        return {
          shouldContinue: true,
          nextStep: 'response',
          query: params.query,
          listingRulesSearchNegative: true
        };
      }
    } catch (error) {
      console.error('Error in step 2:', error);
      return { 
        shouldContinue: true, 
        nextStep: 'response', 
        query: params.query,
        error
      };
    }
  };

  /**
   * Step 3: Takeovers Code Search
   * - Search in Summary and Index_Takeovers Code
   * - Check if match found and analyze
   * - Determine if execution guidance needed
   */
  const executeStep3 = async (params: any) => {
    setCurrentStep('takeoversCode');
    setStepProgress('Searching Takeovers Code summary and index');
    
    try {
      // Step 3(a): Search Summary and Index for Takeovers Code
      const response = await grokService.getRegulatoryContext(
        `Search specifically in "Summary and Index_Takeovers Code.docx" for: ${params.query}`
      );
      
      const takeoversCodeContext = response.text || '';
      const reasoning = '';
      
      // Step 3(b-c): Check if search was positive
      const searchPositive = takeoversCodeContext && takeoversCodeContext.trim() !== '';
      
      if (searchPositive) {
        setStepProgress('Found relevant Takeovers Code information');
        
        // Search in the codes on takeovers and mergers document
        const detailedResponse = await grokService.getRegulatoryContext(
          `Find detailed information in "the codes on takeovers and mergers and share buy backs.pdf" about: ${params.query}`
        );
        
        const detailedTakeoverContext = detailedResponse.text || '';
        
        let enhancedContext = takeoversCodeContext;
        if (detailedTakeoverContext) {
          enhancedContext += "\n\n--- Detailed Takeovers Code Information ---\n\n" + detailedTakeoverContext;
        }
        
        // Add any previous listing rules context if available
        if (params.listingRulesContext) {
          enhancedContext = params.listingRulesContext + "\n\n--- Takeovers Code Context ---\n\n" + enhancedContext;
        }
        
        // Step 3(e-f): Check if execution guidance is needed
        const executionRequired = 
          params.query.toLowerCase().includes('process') ||
          params.query.toLowerCase().includes('how to') ||
          params.query.toLowerCase().includes('steps') ||
          params.query.toLowerCase().includes('procedure') ||
          params.query.toLowerCase().includes('timeline') ||
          params.query.toLowerCase().includes('timetable');
          
        if (executionRequired) {
          return {
            shouldContinue: true,
            nextStep: 'execution',
            query: params.query,
            takeoversCodeContext: enhancedContext,
            regulatoryContext: enhancedContext,
            executionRequired: true
          };
        }
        
        return {
          shouldContinue: true,
          nextStep: 'response',
          query: params.query,
          takeoversCodeContext: enhancedContext,
          regulatoryContext: enhancedContext,
          executionRequired: false
        };
      } else {
        // Step 3(g-h): Negative search - check if execution guidance is needed
        setStepProgress('No specific Takeovers Code found, checking if execution guidance is needed');
        
        const executionRequired = 
          params.query.toLowerCase().includes('process') ||
          params.query.toLowerCase().includes('how to') ||
          params.query.toLowerCase().includes('steps') ||
          params.query.toLowerCase().includes('procedure') ||
          params.query.toLowerCase().includes('timeline') ||
          params.query.toLowerCase().includes('timetable');
          
        if (executionRequired) {
          return {
            shouldContinue: true,
            nextStep: 'execution',
            query: params.query,
            executionRequired: true
          };
        }
        
        return {
          shouldContinue: true,
          nextStep: 'response',
          query: params.query,
          takeoversCodeSearchNegative: true
        };
      }
    } catch (error) {
      console.error('Error in step 3:', error);
      return { 
        shouldContinue: true, 
        nextStep: 'response', 
        query: params.query,
        error
      };
    }
  };

  /**
   * Step 4: Execution Guidance
   * - Check Documents Checklist, Working Plan, and Timetable
   * - Compile relevant execution information
   */
  const executeStep4 = async (params: any) => {
    setCurrentStep('execution');
    setStepProgress('Retrieving execution guidance documents');
    
    try {
      const executionContexts: string[] = [];
      let transactionType = '';
      
      // Try to identify transaction type from query or context
      if (params.query.toLowerCase().includes('rights issue')) {
        transactionType = 'rights issue';
      } else if (params.query.toLowerCase().includes('open offer')) {
        transactionType = 'open offer';
      } else if (params.query.toLowerCase().includes('takeover')) {
        transactionType = 'takeover';
      } else if (params.query.toLowerCase().includes('whitewash') || params.query.toLowerCase().includes('waiver')) {
        transactionType = 'whitewash waiver';
      } else if (params.query.toLowerCase().includes('share consolidation')) {
        transactionType = 'share consolidation';
      }
      
      // Step 4(a): Check Documents Checklist
      setStepProgress('Checking document requirements');
      const checklistResponse = await grokService.getRegulatoryContext(
        `Find information in "Documents Checklist.doc" about ${transactionType || params.query} transaction documents`
      );
      
      const checklistContext = checklistResponse.text || '';
      
      if (checklistContext && checklistContext.trim() !== '') {
        executionContexts.push("--- Document Requirements ---\n\n" + checklistContext);
      }
      
      // Step 4(b): Check Working Plan
      setStepProgress('Retrieving working plan information');
      const workingPlanResponse = await grokService.getRegulatoryContext(
        `Find information in "Working Plan.doc" about ${transactionType || params.query} transaction steps`
      );
      
      const workingPlanContext = workingPlanResponse.text || '';
      
      if (workingPlanContext && workingPlanContext.trim() !== '') {
        executionContexts.push("--- Working Plan ---\n\n" + workingPlanContext);
      }
      
      // Step 4(c): Check Timetable
      setStepProgress('Getting timetable information');
      const timetableResponse = await grokService.getRegulatoryContext(
        `Find information in "Timetable.doc" about ${transactionType || params.query} transaction timeline`
      );
      
      const timetableContext = timetableResponse.text || '';
      
      if (timetableContext && timetableContext.trim() !== '') {
        executionContexts.push("--- Transaction Timeline ---\n\n" + timetableContext);
      }
      
      // Combine execution guidance with any regulatory context
      let combinedContext = executionContexts.join('\n\n');
      
      if (params.regulatoryContext) {
        combinedContext = params.regulatoryContext + "\n\n--- Execution Guidance ---\n\n" + combinedContext;
      } else if (params.listingRulesContext) {
        combinedContext = params.listingRulesContext + "\n\n--- Execution Guidance ---\n\n" + combinedContext;
      } else if (params.takeoversCodeContext) {
        combinedContext = params.takeoversCodeContext + "\n\n--- Execution Guidance ---\n\n" + combinedContext;
      }
      
      return {
        shouldContinue: true,
        nextStep: 'response',
        query: params.query,
        executionContext: combinedContext,
        regulatoryContext: combinedContext
      };
    } catch (error) {
      console.error('Error in step 4:', error);
      return { 
        shouldContinue: true, 
        nextStep: 'response', 
        query: params.query,
        error
      };
    }
  };

  /**
   * Step 5: Response Generation
   * - Compile final response from all context
   * - Translate to Chinese if original query was Chinese
   */
  const executeStep5 = async (params: any) => {
    setCurrentStep('response');
    setStepProgress('Generating final response');
    
    try {
      // Prepare the response parameters with all available context
      const responseContext = params.regulatoryContext || 
                             params.executionContext || 
                             params.listingRulesContext || 
                             params.takeoversCodeContext || '';
      
      const responseParams = {
        prompt: params.query,
        regulatoryContext: responseContext
      };
      
      // Generate response using Grok
      const response = await grokService.generateResponse(responseParams);
      
      // Step 5(b): If original input was Chinese, translate response
      if (lastInputWasChinese) {
        setStepProgress('Translating response to Chinese');
        
        try {
          const translation = await grokService.translateContent(response.text, 'zh');
          
          return {
            completed: true,
            originalResponse: response.text,
            translatedResponse: translation.text,
            requiresTranslation: true
          };
        } catch (translationError) {
          console.error('Translation error:', translationError);
          
          // Return original response if translation fails
          return {
            completed: true,
            response: response.text,
            translationError,
            requiresTranslation: true
          };
        }
      }
      
      // Return English response
      return {
        completed: true,
        response: response.text
      };
    } catch (error) {
      console.error('Error in step 5:', error);
      return { 
        completed: false,
        error
      };
    }
  };

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
      const step1Result = await executeStep1(queryText);
      
      if (!step1Result.shouldContinue) {
        if (step1Result.nextStep === 'response') {
          // Generate response with minimal context
          const responseResult = await executeStep5({
            query: step1Result.query,
            isRegulatoryRelated: step1Result.isRegulatoryRelated
          });
          
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
      
      // Determine next step based on Step 1 result
      let nextStep = step1Result.nextStep;
      let currentParams = { ...step1Result };
      let stepResult;
      
      // Execute subsequent steps based on the workflow
      while (nextStep !== 'response' || !stepResult?.completed) {
        switch (nextStep) {
          case 'listingRules':
            stepResult = await executeStep2(currentParams);
            break;
            
          case 'takeoversCode':
            stepResult = await executeStep3(currentParams);
            break;
            
          case 'execution':
            stepResult = await executeStep4(currentParams);
            break;
            
          case 'response':
            stepResult = await executeStep5(currentParams);
            
            // Create bot response message
            const botMessage: Message = {
              id: Date.now().toString(),
              content: stepResult.translatedResponse || stepResult.response || 'Sorry, I could not generate a response.',
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
        
        if (stepResult && stepResult.nextStep) {
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
