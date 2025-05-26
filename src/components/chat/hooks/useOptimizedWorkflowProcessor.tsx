
import { useState } from 'react';
import { Message } from '../ChatMessage';
import { parallelContextService } from '@/services/regulatory/context/parallelContextService';
import { responseStreamingService } from '@/services/response/streaming/responseStreamingService';
import { smartCacheService } from '@/services/cache/smartCacheService';
import { step5Response } from './useStep5Response';
import { useLanguageState } from './useLanguageState';
import { useTranslationManager } from './useTranslationManager';

interface OptimizedWorkflowProps {
  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  setLastQuery: React.Dispatch<React.SetStateAction<string>>;
  isGrokApiKeySet: boolean;
  setApiKeyDialogOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

/**
 * Optimized workflow processor with parallel processing and streaming
 */
export const useOptimizedWorkflowProcessor = ({
  messages,
  setMessages,
  setLastQuery,
  isGrokApiKeySet,
  setApiKeyDialogOpen
}: OptimizedWorkflowProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [processingStage, setProcessingStage] = useState('');
  
  const { lastInputWasChinese } = useLanguageState();
  const { manageTranslations } = useTranslationManager();
  
  /**
   * Execute optimized workflow with parallel processing
   */
  const executeOptimizedWorkflow = async (query: string) => {
    if (!isGrokApiKeySet) {
      setApiKeyDialogOpen(true);
      return;
    }
    
    setIsLoading(true);
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
      
      // Create assistant message placeholder with streaming content
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        isUser: false,
        content: 'Processing your request...',
        timestamp: new Date(),
        isError: false,
        metadata: { isStreaming: true }
      };
      
      setMessages([...updatedMessages, assistantMessage]);
      
      // Create streaming response handler
      const streamingResponse = responseStreamingService.createStreamingResponse('Analyzing your query...');
      
      // Update UI with streaming content
      streamingResponse.onUpdate((content) => {
        setMessages(prevMessages => {
          const newMessages = [...prevMessages];
          const assistantIndex = newMessages.findIndex(m => m.id === assistantMessage.id);
          if (assistantIndex !== -1) {
            newMessages[assistantIndex] = {
              ...newMessages[assistantIndex],
              content: content
            };
          }
          return newMessages;
        });
      });
      
      // Check cache first for quick responses
      setProcessingStage('Checking cached responses...');
      const cachedResult = smartCacheService.get(query, 'regulatory');
      
      if (cachedResult) {
        console.log('Using cached response for faster processing');
        streamingResponse.setContent(cachedResult.response);
        streamingResponse.complete();
        setIsLoading(false);
        return;
      }
      
      // Parallel context retrieval (no artificial delays)
      setProcessingStage('Gathering regulatory context...');
      streamingResponse.appendContent('\n\nGathering regulatory context...');
      
      const contextResult = await parallelContextService.getContextInParallel(query, {
        isPreliminaryAssessment: false,
        metadata: { 
          optimized: true,
          useParallelProcessing: true
        }
      });
      
      // Prepare parameters for response generation
      const params = {
        query,
        regulatoryContext: contextResult.context,
        guidanceContext: contextResult.guidanceContext,
        sourceMaterials: contextResult.sourceMaterials,
        skipSequentialSearches: true,
        isRegulatoryRelated: Boolean(contextResult.context),
        optimized: true
      };
      
      // Generate response with streaming updates
      setProcessingStage('Generating response...');
      streamingResponse.setContent('Generating detailed response...');
      
      const step5Result = await step5Response(
        params,
        (progress) => {
          setProcessingStage(progress);
          streamingResponse.setContent(`Generating response: ${progress}`);
        },
        lastInputWasChinese
      );
      
      // Update with final response
      if (step5Result && step5Result.response) {
        streamingResponse.setContent(step5Result.response);
        
        // Cache the result for future use
        smartCacheService.set(query, {
          response: step5Result.response,
          metadata: step5Result.metadata
        }, 'regulatory');
        
        // Handle translations if needed
        if (step5Result.requiresTranslation) {
          const finalMessages = [...updatedMessages];
          const assistantIndex = finalMessages.findIndex(m => m.id === assistantMessage.id);
          if (assistantIndex !== -1) {
            manageTranslations(finalMessages, assistantIndex);
          }
        }
      } else {
        streamingResponse.setContent("I wasn't able to generate a proper response. Please try again.");
      }
      
      streamingResponse.complete();
      
    } catch (error) {
      console.error('Optimized workflow error:', error);
      
      const errorMessage = `I encountered an error while processing your request. Please try again.${
        error instanceof Error ? ` (${error.message})` : ''
      }`;
      
      setMessages(prevMessages => {
        const newMessages = [...prevMessages];
        const assistantIndex = newMessages.findIndex(m => m.id === assistantMessage.id);
        if (assistantIndex !== -1) {
          newMessages[assistantIndex] = {
            ...newMessages[assistantIndex],
            content: errorMessage,
            isError: true
          };
        }
        return newMessages;
      });
    } finally {
      setIsLoading(false);
      setProcessingStage('');
    }
  };

  return {
    isLoading,
    processingStage,
    executeOptimizedWorkflow
  };
};
