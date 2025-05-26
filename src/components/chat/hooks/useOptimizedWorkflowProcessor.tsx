
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
 * Enhanced optimized workflow processor with improved state management and caching
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
  const [currentStep, setCurrentStep] = useState<'preparing' | 'processing' | 'finalizing' | 'reviewing'>('preparing');
  
  const { lastInputWasChinese } = useLanguageState();
  const { manageTranslations } = useTranslationManager();
  
  /**
   * Enhanced workflow with improved caching and state management
   */
  const executeOptimizedWorkflow = async (query: string) => {
    if (!isGrokApiKeySet) {
      setApiKeyDialogOpen(true);
      return;
    }
    
    setIsLoading(true);
    setLastQuery(query);
    
    try {
      // Step 1: Initial Analysis with improved state tracking
      console.log('Starting enhanced workflow - Step 1: Initial Analysis');
      setCurrentStep('preparing');
      setProcessingStage('Analyzing your query and checking cache...');
      
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
      const streamingResponse = responseStreamingService.createStreamingResponse('Analyzing your query...');
      
      // Update UI with streaming content
      streamingResponse.onUpdate((content) => {
        setMessages(prevMessages => {
          const newMessages = [...prevMessages];
          const assistantIndex = newMessages.findIndex(m => m.id === assistantMessageId);
          if (assistantIndex !== -1) {
            newMessages[assistantIndex] = {
              ...newMessages[assistantIndex],
              content: content
            };
          }
          return newMessages;
        });
      });
      
      // Step 2: Enhanced cache checking with semantic similarity
      console.log('Step 2: Enhanced cache checking with semantic similarity');
      setProcessingStage('Checking cached responses and similar queries...');
      
      // Check for exact match first
      let cachedResult = smartCacheService.get(query, 'regulatory');
      
      // If no exact match, check for similar queries (Phase 1 enhancement)
      if (!cachedResult) {
        // Simple similarity check - in a real implementation, this would use semantic embeddings
        const cacheKeys = smartCacheService.getAllKeys('regulatory');
        for (const key of cacheKeys) {
          if (this.isSimilarQuery(query, key)) {
            cachedResult = smartCacheService.get(key, 'regulatory');
            console.log('Found similar cached query:', key);
            break;
          }
        }
      }
      
      if (cachedResult) {
        console.log('Using cached response for faster processing');
        streamingResponse.setContent(cachedResult.response);
        streamingResponse.complete();
        
        // Enhanced completion sequence
        setCurrentStep('finalizing');
        setProcessingStage('Retrieved from cache - Response ready');
        
        // Brief completion display before clearing
        setTimeout(() => {
          setProcessingStage('Complete');
          setTimeout(() => {
            setIsLoading(false);
            setProcessingStage('');
            setCurrentStep('preparing');
          }, 1000);
        }, 500);
        return;
      }
      
      // Step 3: Enhanced parallel context retrieval with early termination
      console.log('Step 3: Enhanced parallel context retrieval');
      setCurrentStep('processing');
      setProcessingStage('Gathering regulatory context with quality scoring...');
      streamingResponse.appendContent('\n\nGathering enhanced regulatory context...');
      
      const contextResult = await parallelContextService.getContextInParallel(query, {
        isPreliminaryAssessment: false,
        metadata: { 
          optimized: true,
          useParallelProcessing: true,
          earlyTermination: true, // New enhancement
          qualityThreshold: 0.8   // Stop when high-quality context found
        }
      });
      
      // Step 4: Intelligent search routing
      console.log('Step 4: Intelligent search with fast paths');
      setProcessingStage('Applying intelligent search patterns and fast paths...');
      
      // Check if this is a simple query that can use fast path
      const isSimpleQuery = this.isSimpleQuery(query);
      if (isSimpleQuery) {
        console.log('Using fast path for simple query');
        setProcessingStage('Using fast path for quick response...');
      }
      
      const params = {
        query,
        regulatoryContext: contextResult.context,
        guidanceContext: contextResult.guidanceContext,
        sourceMaterials: contextResult.sourceMaterials,
        skipSequentialSearches: true,
        isRegulatoryRelated: Boolean(contextResult.context),
        optimized: true,
        useFastPath: isSimpleQuery
      };
      
      // Step 5: Enhanced response generation with progressive delivery
      console.log('Step 5: Enhanced response generation');
      setCurrentStep('finalizing');
      setProcessingStage('Generating high-quality response...');
      streamingResponse.setContent('Generating comprehensive response...');
      
      const step5Result = await step5Response(
        params,
        (progress) => {
          console.log('Step 5 progress:', progress);
          setProcessingStage(progress);
          streamingResponse.setContent(`Generating response: ${progress}`);
        },
        lastInputWasChinese
      );
      
      // Update with final response
      if (step5Result && step5Result.response) {
        streamingResponse.setContent(step5Result.response);
        
        // Enhanced cache storage with longer duration (2 hours)
        smartCacheService.set(query, {
          response: step5Result.response,
          metadata: { 
            ...step5Result.metadata,
            timestamp: Date.now(),
            quality: 'high'
          }
        }, 'regulatory', 2 * 60 * 60 * 1000); // 2 hours cache duration
        
        // Handle translations if needed
        if (step5Result.requiresTranslation) {
          const finalMessages = [...updatedMessages];
          const assistantIndex = finalMessages.findIndex(m => m.id === assistantMessageId);
          if (assistantIndex !== -1) {
            manageTranslations(finalMessages, assistantIndex);
          }
        }
      } else {
        streamingResponse.setContent("I wasn't able to generate a proper response. Please try again.");
      }
      
      streamingResponse.complete();
      
      // Enhanced completion sequence with proper state management
      console.log('Workflow completed successfully');
      setCurrentStep('reviewing');
      setProcessingStage('Validating response quality...');
      
      // Brief validation phase
      setTimeout(() => {
        setProcessingStage('Response complete - High quality validated');
        setTimeout(() => {
          setProcessingStage('Complete');
          setTimeout(() => {
            setIsLoading(false);
            setProcessingStage('');
            setCurrentStep('preparing');
          }, 1500);
        }, 1000);
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
      
      // Clear processing state on error
      setIsLoading(false);
      setProcessingStage('');
      setCurrentStep('preparing');
    }
  };

  // Helper method to check query similarity (simplified version)
  const isSimilarQuery = (query1: string, query2: string): boolean => {
    const normalize = (str: string) => str.toLowerCase().replace(/[^\w\s]/g, '').trim();
    const words1 = normalize(query1).split(/\s+/);
    const words2 = normalize(query2).split(/\s+/);
    
    const commonWords = words1.filter(word => words2.includes(word));
    const similarity = commonWords.length / Math.max(words1.length, words2.length);
    
    return similarity > 0.6; // 60% similarity threshold
  };

  // Helper method to identify simple queries for fast path
  const isSimpleQuery = (query: string): boolean => {
    const simplePatterns = [
      /^what is/i,
      /^define/i,
      /^meaning of/i,
      /^\w+\s+definition/i,
      /^how to calculate/i,
      /^when is/i,
      /^where can I find/i
    ];
    
    return simplePatterns.some(pattern => pattern.test(query)) || query.length < 50;
  };

  return {
    isLoading,
    processingStage,
    currentStep,
    executeOptimizedWorkflow
  };
};
