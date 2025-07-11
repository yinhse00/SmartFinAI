import { useState } from 'react';
import { Message } from '../ChatMessage';
import { step1Initial } from './useStep1Initial';
import { step2ListingRules } from './useStep2ListingRules';
import { step3TakeoversCode } from './useStep3TakeoversCode';
import { step4Execution } from './useStep4Execution';
import { step5Response } from './useStep5Response';
import { WorkflowProcessorProps, Step1Result } from './workflow/types';
import { useContextRetrieval } from './useContextRetrieval';
import { useLanguageState } from './useLanguageState';
import { useTranslationManager } from './useTranslationManager';
import { mappingSpreadsheetService } from '@/services/regulatory/mappingSpreadsheetService';
import { WorkflowPhase } from '../workflow/workflowConfig';

// Update the local WorkflowStep type to include both WorkflowPhase and legacy steps
type WorkflowStep = WorkflowPhase | 'listingRules' | 'takeoversCode' | 'execution' | 'response' | 'complete';

/**
 * Hook for managing the workflow of processing and responding to queries
 * Enhanced with parallel processing capabilities and improved guidance material lookup
 */
export const useWorkflowProcessor = ({
  messages,
  setMessages,
  setLastQuery,
  isGrokApiKeySet,
  setApiKeyDialogOpen
}: WorkflowProcessorProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState<WorkflowStep>(WorkflowPhase.ANALYSIS);
  const [stepProgress, setStepProgress] = useState('');
  
  // Use enhanced context retrieval with parallel processing
  const { retrieveRegulatoryContext } = useContextRetrieval();
  const { lastInputWasChinese, checkIsChineseInput, storeTranslation } = useLanguageState();
  const { manageTranslations } = useTranslationManager();
  
  /**
   * Execute the workflow for a query with enhanced parallel processing
   * and intelligent guidance mapping
   */
  const executeWorkflow = async (query: string) => {
    if (!isGrokApiKeySet) {
      setApiKeyDialogOpen(true);
      return;
    }
    
    setIsLoading(true);
    setCurrentStep(WorkflowPhase.ANALYSIS);
    setLastQuery(query);
    
    try {
      // Add user message
      const userMessage: Message = {
        id: Date.now().toString(),
        isUser: true,
        content: query,
        timestamp: new Date()
      };
      
      const updatedMessages = [...messages, userMessage];
      setMessages(updatedMessages);
      
      // Create assistant message placeholder
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        isUser: false,
        content: '',  // Initially empty, will be populated later
        timestamp: new Date(),
        isError: false,
        metadata: {}
      };
      
      setMessages([...updatedMessages, assistantMessage]);
      
      // Step 1: Enhanced Initial Processing with hybrid search
      setCurrentStep(WorkflowPhase.ANALYSIS);
      const step1Result = await step1Initial({
        query,
        storeTranslation,
        setStepProgress,
        retrieveRegulatoryContext: (q: string, prioritizeFAQ?: boolean) => 
          retrieveRegulatoryContext(q, prioritizeFAQ, { useHybridSearch: true })
      });
      
      // Get workflow parameters from step 1 result
      let params: any = { 
        ...step1Result,
        skipSequentialSearches: true // Skip redundant checks as requested
      };
      
      // Extract topics from query for guidance lookups
      const topics = await mappingSpreadsheetService.extractTopicsFromQuery(query);
      
      // Check for guidance materials and listing decisions
      setStepProgress(lastInputWasChinese ? '搜索相关指引和上市决定' : 'Searching for relevant guidance and listing decisions');
      const { guidanceContext, sourceMaterials } = await mappingSpreadsheetService.findRelevantGuidance(query, topics);
      
      if (guidanceContext && guidanceContext !== "No specific guidance materials found.") {
        // Add guidance context to params
        params.guidanceContext = guidanceContext;
        params.sourceMaterials = sourceMaterials;
        
        // If we have regulatory context from step 1, combine with guidance context
        if (params.regulatoryContext) {
          params.regulatoryContext = params.regulatoryContext + "\n\n--- Guidance and FAQs ---\n\n" + guidanceContext;
        } else {
          params.regulatoryContext = guidanceContext;
        }
      }

      // For execution queries, we still want to use the execution step
      let nextStep: WorkflowStep = WorkflowPhase.RESPONSE_GENERATION;
      if (query.toLowerCase().includes('process') || 
          query.toLowerCase().includes('how to') || 
          query.toLowerCase().includes('steps') || 
          query.toLowerCase().includes('procedure') || 
          query.toLowerCase().includes('timeline') || 
          query.toLowerCase().includes('timetable')) {
        nextStep = 'execution';
      }

      // Step 4: Execution Process (if needed)
      if (nextStep === 'execution') {
        setCurrentStep('execution' as WorkflowStep);
        const step4Result = await step4Execution(params, setStepProgress);
        params = { ...params, ...step4Result };
        // Properly handle the nextStep assignment with type safety
        nextStep = (step4Result.nextStep as WorkflowStep) || WorkflowPhase.RESPONSE_GENERATION;
      }
      
      // Step 5: Response Generation (always required)
      setCurrentStep(WorkflowPhase.RESPONSE_GENERATION);
      console.log('Starting step 5 with params:', params);
      const step5Result = await step5Response(
        params, 
        setStepProgress,
        lastInputWasChinese
      );
      console.log('Step 5 result:', step5Result);
      
      // Update assistant message with response
      if (step5Result && step5Result.response) {
        const finalMessages = [...updatedMessages];
        
        // Find and update the assistant message
        const assistantIndex = finalMessages.findIndex(
          (m) => m.id === assistantMessage.id
        );
        
        if (assistantIndex !== -1) {
          console.log('Updating assistant message at index:', assistantIndex);
          console.log('Response content length:', step5Result.response.length);
          console.log('Response content preview:', step5Result.response.substring(0, 100) + '...');
          
          // Ensure response is never empty - crucial fix for the empty message issue
          const responseContent = step5Result.response && step5Result.response.trim() !== '' 
            ? step5Result.response 
            : "I wasn't able to generate a proper response. Please try again.";
          
          finalMessages[assistantIndex] = {
            ...assistantMessage,
            content: responseContent,  // Use the ensured non-empty content
            metadata: {
              ...(step5Result.metadata || {}),
              guidanceMaterialsUsed: Boolean(params.guidanceContext),
              sourceMaterials: params.sourceMaterials || [],
              searchStrategy: params.searchStrategy,
              liveResultsCount: params.liveResultsCount,
              localResultsCount: params.localResultsCount
            }
          };
          
          setMessages(finalMessages);
          console.log('Messages after update:', finalMessages.map(m => `${m.isUser ? 'user' : 'bot'}: ${m.content ? m.content.substring(0, 30) + '...' : '[EMPTY]'}`));
          
          // Handle translations if needed
          if (step5Result.requiresTranslation) {
            manageTranslations(finalMessages, assistantIndex);
          }
        } else {
          console.error('Could not find assistant message to update');
          
          // Add a new message if we couldn't find the original - with guaranteed content
          const newAssistantMessage: Message = {
            id: (Date.now() + 2).toString(),
            isUser: false,
            content: step5Result.response || "I wasn't able to generate a proper response. Please try again.",
            timestamp: new Date(),
            metadata: {
              ...(step5Result.metadata || {}),
              guidanceMaterialsUsed: Boolean(params.guidanceContext),
              sourceMaterials: params.sourceMaterials || [],
              searchStrategy: params.searchStrategy,
              liveResultsCount: params.liveResultsCount,
              localResultsCount: params.localResultsCount
            }
          };
          
          setMessages([...updatedMessages, newAssistantMessage]);
        }
      } else {
        console.error('No valid response content in step5Result:', step5Result);
        
        // Handle empty response case with a clear error message
        const errorMessage: Message = {
          id: (Date.now() + 2).toString(),
          isUser: false,
          content: "I'm sorry, I couldn't generate a proper response. Please try again.",
          timestamp: new Date(),
          isError: true
        };
        
        // Find the placeholder message and replace it with error message
        const finalMessages = [...updatedMessages];
        const assistantIndex = finalMessages.findIndex(m => m.id === assistantMessage.id);
        
        if (assistantIndex !== -1) {
          finalMessages[assistantIndex] = errorMessage;
          setMessages(finalMessages);
        } else {
          // If we can't find the original, add a new error message
          setMessages([...updatedMessages, errorMessage]);
        }
      }
      
      setCurrentStep(WorkflowPhase.COMPLETE);
    } catch (error) {
      console.error('Workflow error:', error);
      
      // Update messages with error
      const errorMessage = `I encountered an error while processing your request. Please try again.${
        error instanceof Error ? ` (${error.message})` : ''
      }`;
      
      const updatedMessages = [...messages];
      const assistantIndex = updatedMessages.findIndex(
        (m) => !m.isUser && !m.content
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
          isUser: false,
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
