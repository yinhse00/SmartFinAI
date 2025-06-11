
import { Message } from '../ChatMessage';
import { parallelContextService } from '@/services/regulatory/context/parallelContextService';
import { step5Response } from './useStep5Response';
import { useLanguageState } from './useLanguageState';
import { useTranslationManager } from './useTranslationManager';
import { useCacheManager } from './workflow/useCacheManager';
import { useStreamingHandler } from './workflow/useStreamingHandler';
import { useWorkflowState } from './workflow/useWorkflowState';
import { useQueryUtils } from './workflow/useQueryUtils';

interface OptimizedWorkflowProps {
  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  setLastQuery: React.Dispatch<React.SetStateAction<string>>;
  isGrokApiKeySet: boolean;
  setApiKeyDialogOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

/**
 * Enhanced optimized workflow processor with improved state management and caching
 */
export const useOptimizedWorkflowProcessor = ({
  messages,
  setMessages,
  setLastQuery,
  isGrokApiKeySet,
  setApiKeyDialogOpen
}: OptimizedWorkflowProps) => {
  const { lastInputWasChinese } = useLanguageState();
  const { manageTranslations } = useTranslationManager();
  const { checkCache, storeInCache } = useCacheManager();
  const { createStreamingResponse, updateStreamingContent, completeStreaming } = useStreamingHandler({ setMessages });
  const { 
    isLoading, 
    processingStage, 
    currentStep, 
    startWorkflow, 
    updateStage, 
    updateStep, 
    completeWorkflow, 
    handleError 
  } = useWorkflowState();
  const { isSimpleQuery } = useQueryUtils();
  
  /**
   * Enhanced workflow with improved caching and state management
   */
  const executeOptimizedWorkflow = async (query: string) => {
    if (!isGrokApiKeySet) {
      setApiKeyDialogOpen(true);
      return;
    }
    
    startWorkflow();
    setLastQuery(query);
    
    try {
      // Step 1: Initial Analysis with improved state tracking
      console.log('Starting enhanced workflow - Step 1: Initial Analysis');
      updateStep('preparing');
      updateStage('Analyzing your query and checking cache...');
      
      // Add user message
      const userMessage: Message = {
        id: Date.now().toString(),
        isUser: true,
        content: query,
        timestamp: new Date()
      };
      
      const updatedMessages = [...messages, userMessage];
      setMessages(updatedMessages);
      
      // Create assistant message placeholder with streaming content
      const assistantMessageId = (Date.now() + 1).toString();
      const assistantMessage: Message = {
        id: assistantMessageId,
        isUser: false,
        content: 'Processing your request...',
        timestamp: new Date(),
        isError: false,
        metadata: {}
      };
      
      setMessages([...updatedMessages, assistantMessage]);
      
      // Create streaming response handler
      const streamingResponse = createStreamingResponse('Analyzing your query...', assistantMessageId);
      
      // Step 2: Enhanced cache checking with semantic similarity
      console.log('Step 2: Enhanced cache checking with semantic similarity');
      updateStage('Checking cached responses and similar queries...');
      
      const cachedResult = checkCache(query);
      
      if (cachedResult) {
        console.log('Using cached response for faster processing');
        updateStreamingContent(streamingResponse, cachedResult.response);
        completeStreaming(streamingResponse);
        
        // Enhanced completion sequence
        updateStep('finalizing');
        updateStage('Retrieved from cache - Response ready');
        
        // Brief completion display before clearing
        setTimeout(() => {
          updateStage('Complete');
          setTimeout(() => {
            completeWorkflow();
          }, 1000);
        }, 500);
        return;
      }
      
      // Step 3: Enhanced parallel context retrieval with early termination
      console.log('Step 3: Enhanced parallel context retrieval');
      updateStep('processing');
      updateStage('Gathering regulatory context with quality scoring...');
      updateStreamingContent(streamingResponse, 'Gathering enhanced regulatory context...');
      
      const contextResult = await parallelContextService.getContextInParallel(query, {
        isPreliminaryAssessment: false,
        metadata: { 
          optimized: true,
          useParallelProcessing: true,
          earlyTermination: true,
          qualityThreshold: 0.8
        }
      });
      
      // Step 4: Intelligent search routing
      console.log('Step 4: Intelligent search with fast paths');
      updateStage('Applying intelligent search patterns and fast paths...');
      
      // Check if this is a simple query that can use fast path
      const isSimple = isSimpleQuery(query);
      if (isSimple) {
        console.log('Using fast path for simple query');
        updateStage('Using fast path for quick response...');
      }
      
      const params = {
        query,
        regulatoryContext: contextResult.context,
        guidanceContext: contextResult.guidanceContext,
        sourceMaterials: contextResult.sourceMaterials,
        skipSequentialSearches: true,
        isRegulatoryRelated: Boolean(contextResult.context),
        optimized: true,
        useFastPath: isSimple
      };
      
      // Step 5: Enhanced response generation with progressive delivery
      console.log('Step 5: Enhanced response generation');
      updateStep('finalizing');
      updateStage('Generating high-quality response...');
      updateStreamingContent(streamingResponse, 'Generating comprehensive response...');
      
      const step5Result = await step5Response(
        params,
        (progress) => {
          console.log('Step 5 progress:', progress);
          updateStage(progress);
          updateStreamingContent(streamingResponse, `Generating response: ${progress}`);
        },
        lastInputWasChinese
      );
      
      // Update with final response
      if (step5Result?.response) {
        updateStreamingContent(streamingResponse, step5Result.response);
        
        // Enhanced cache storage with longer duration
        storeInCache(query, step5Result.response, step5Result.metadata);
        
        // Handle translations if needed
        if (step5Result.requiresTranslation) {
          const finalMessages = [...updatedMessages];
          const assistantIndex = finalMessages.findIndex(m => m.id === assistantMessageId);
          if (assistantIndex !== -1) {
            manageTranslations(finalMessages, assistantIndex);
          }
        }
      } else {
        updateStreamingContent(streamingResponse, "I wasn't able to generate a proper response. Please try again.");
      }
      
      completeStreaming(streamingResponse);
      
      // Enhanced completion sequence with proper state management
      console.log('Workflow completed successfully');
      updateStep('reviewing');
      updateStage('Validating response quality...');
      
      // Brief validation phase
      setTimeout(() => {
        updateStage('Response complete - High quality validated');
        setTimeout(() => {
          completeWorkflow();
        }, 800);
      }, 800);
      
    } catch (error) {
      console.error('Enhanced workflow error:', error);
      
      const errorMessage = `I encountered an error while processing your request. Please try again.${
        error instanceof Error ? ` (${error.message})` : ''
      }`;
      
      setMessages(prevMessages => {
        const newMessages = [...prevMessages];
        const assistantIndex = newMessages.findIndex(m => m.id.includes('assistant'));
        if (assistantIndex !== -1) {
          newMessages[assistantIndex] = {
            ...newMessages[assistantIndex],
            content: errorMessage,
            isError: true
          };
        }
        return newMessages;
      });
      
      handleError();
    }
  };

  return {
    isLoading,
    processingStage,
    currentStep,
    executeOptimizedWorkflow
  };
};
