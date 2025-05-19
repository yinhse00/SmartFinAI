
import { useState } from 'react';
import { Message } from '../ChatMessage';
import { step1Initial } from './workflow/step1Initial';
import { step2ListingRules } from './useStep2ListingRules';
import { step3TakeoversCode } from './useStep3TakeoversCode';
import { step4Execution } from './useStep4Execution';
import { step5Response } from './useStep5Response';
import { WorkflowStep, WorkflowProcessorProps } from './workflow/types';
import { useContextRetrieval } from './useContextRetrieval';
import { useLanguageState } from './useLanguageState';
import { useTranslationManager } from './useTranslationManager';
import { mappingSpreadsheetService } from '@/services/regulatory/mappingSpreadsheetService';

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
  const [currentStep, setCurrentStep] = useState<WorkflowStep>('initial');
  const [stepProgress, setStepProgress] = useState('');
  const [streamingMessageId, setStreamingMessageId] = useState<string | null>(null);
  
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
        content: '',  // Initially empty, will be populated later
        timestamp: new Date(),
        isError: false,
        metadata: {},
        isStreaming: true // Mark as streaming
      };
      
      setMessages([...updatedMessages, assistantMessage]);
      setStreamingMessageId(assistantMessage.id);
      
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
      let nextStep = 'response';
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
        setCurrentStep('execution');
        const step4Result = await step4Execution(params, setStepProgress);
        params = { ...params, ...step4Result };
        nextStep = step4Result.nextStep;
      }
      
      // Step 5: Response Generation with streaming (always required)
      setCurrentStep('response');
      console.log('Starting step 5 with params:', params);
      
      // Create a function to handle streaming updates
      const handleStreamUpdate = (chunk: string) => {
        setMessages(currentMessages => {
          const updatedMessages = [...currentMessages];
          const assistantIndex = updatedMessages.findIndex(m => m.id === assistantMessage.id);
          
          if (assistantIndex !== -1) {
            // Update the message with the new chunk
            updatedMessages[assistantIndex] = {
              ...updatedMessages[assistantIndex],
              content: chunk,
              isStreaming: true
            };
          }
          
          return updatedMessages;
        });
      };
      
      // Execute step 5 with streaming support
      const step5Result = await step5Response(
        params, 
        setStepProgress,
        lastInputWasChinese,
        handleStreamUpdate // Pass the streaming handler
      );
      
      console.log('Step 5 result:', step5Result);
      
      // Update assistant message with final response
      if (step5Result && step5Result.response) {
        const finalMessages = [...updatedMessages];
        
        // Find and update the assistant message
        const assistantIndex = finalMessages.findIndex(m => m.id === assistantMessage.id);
        
        if (assistantIndex !== -1) {
          console.log('Updating assistant message at index:', assistantIndex);
          console.log('Response content length:', step5Result.response.length);
          console.log('Response content preview:', step5Result.response.substring(0, 100) + '...');
          
          // Ensure response is never empty - crucial fix for the empty message issue
          const responseContent = step5Result.response && step5Result.response.trim() !== '' 
            ? step5Result.response 
            : "I wasn't able to generate a proper response. Please try again.";
            
          // Extract metadata if it exists, otherwise provide empty object
          const responseMetadata = step5Result.completed 
            ? (step5Result.metadata || {}) 
            : {};
            
          const requiresTranslation = step5Result.completed 
            ? (step5Result.requiresTranslation || false) 
            : false;
          
          finalMessages[assistantIndex] = {
            ...assistantMessage,
            content: responseContent,  // Use the ensured non-empty content
            isStreaming: false,  // Mark streaming as complete
            metadata: {
              ...responseMetadata,
              guidanceMaterialsUsed: Boolean(params.guidanceContext),
              sourceMaterials: params.sourceMaterials || []
            }
          };
          
          setMessages(finalMessages);
          setStreamingMessageId(null);
          
          // Handle translations if needed
          if (requiresTranslation) {
            manageTranslations(finalMessages, assistantIndex);
          }
        } else {
          console.error('Could not find assistant message to update');
          
          // Add a new message if we couldn't find the original - with guaranteed content
          const newAssistantMessage: Message = {
            id: (Date.now() + 2).toString(),
            sender: 'bot',
            content: step5Result.response || "I wasn't able to generate a proper response. Please try again.",
            timestamp: new Date(),
            metadata: step5Result.completed 
              ? {
                  ...(step5Result.metadata || {}),
                  guidanceMaterialsUsed: Boolean(params.guidanceContext),
                  sourceMaterials: params.sourceMaterials || []
                }
              : {
                  guidanceMaterialsUsed: Boolean(params.guidanceContext),
                  sourceMaterials: params.sourceMaterials || []
                }
          };
          
          setMessages([...updatedMessages, newAssistantMessage]);
        }
      } else {
        console.error('No valid response content in step5Result:', step5Result);
        
        // Handle empty response case with a clear error message
        const errorMessage: Message = {
          id: (Date.now() + 2).toString(),
          sender: 'bot',
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
          isError: true,
          isStreaming: false
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
      
      setStreamingMessageId(null);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    currentStep,
    stepProgress,
    executeWorkflow,
    streamingMessageId
  };
};
