
import { useRef, useState, useCallback, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

/**
 * Hook to manage batch/multi-part response functionality
 * Enhanced with improved automatic batch handling for faster first batch delivery
 */
export const useBatchHandling = () => {
  const { toast } = useToast();
  const batchNumber = useRef(1);
  const [isBatching, setIsBatching] = useState(false);
  const [batchingPrompt, setBatchingPrompt] = useState<string | null>(null);
  const [autoBatch, setAutoBatch] = useState(true);
  const MAX_AUTO_BATCHES = 5; // Increased from 4 to 5 for better coverage
  const batchCompletionTracker = useRef<Record<number, boolean>>({});
  const batchStartTime = useRef<number>(0);
  
  // Track time between batches for analytics
  const batchTimings = useRef<number[]>([]);
  
  // More aggressive detection of complex queries that should use batching
  const shouldUseBatchingForQuery = useCallback((query: string): boolean => {
    const complexIndicators = [
      // Length-based indicators
      query.length > 150,
      // Content-based indicators
      query.toLowerCase().includes('timetable'),
      query.toLowerCase().includes('rights issue'),
      query.toLowerCase().includes('connected transaction'),
      query.toLowerCase().includes('chapter 14a'),
      query.toLowerCase().includes('takeovers code'),
      query.toLowerCase().includes('whitewash waiver'),
      query.toLowerCase().includes('specialist technology'),
      query.toLowerCase().includes('chapter 18c'),
      // Question-based indicators
      (query.match(/\?/g) || []).length > 1, // Multiple questions
      query.toLowerCase().includes('how') && query.toLowerCase().includes('what'),
    ];
    
    // Return true if any indicators match
    return complexIndicators.some(indicator => !!indicator);
  }, []);
  
  const startBatching = useCallback((prompt: string, autoBatchMode = true) => {
    setBatchingPrompt(prompt);
    batchNumber.current = 1;
    setIsBatching(shouldUseBatchingForQuery(prompt));
    setAutoBatch(autoBatchMode);
    // Reset batch completion tracker
    batchCompletionTracker.current = {1: false};
    // Start timing
    batchStartTime.current = Date.now();
    batchTimings.current = [];
    
    // Pre-emptively prepare for batching for complex queries
    if (shouldUseBatchingForQuery(prompt)) {
      console.log('Complex query detected, preparing for batched response');
    }
  }, [shouldUseBatchingForQuery]);
  
  const handleBatchContinuation = useCallback((callback: (query: string, options: any) => Promise<void>) => {
    if (batchingPrompt) {
      // Record timing of previous batch
      const currentTime = Date.now();
      if (batchStartTime.current > 0) {
        const batchDuration = currentTime - batchStartTime.current;
        batchTimings.current.push(batchDuration);
        console.log(`Batch ${batchNumber.current} took ${batchDuration}ms`);
      }
      batchStartTime.current = currentTime;
      
      // Increment batch number
      batchNumber.current += 1;
      
      // Track this batch as not completed yet
      batchCompletionTracker.current[batchNumber.current] = false;
      
      // Add continuation marker to help the API understand this is continuing a previous response
      const continuationPrompt = `${batchingPrompt} [CONTINUATION_PART_${batchNumber.current}]`;
      
      // For auto-batching, add an aggressive timeout to ensure faster delivery
      const batchOptions = { 
        isBatchContinuation: true, 
        batchNumber: batchNumber.current, 
        autoBatch,
        // Add a target response time to encourage faster delivery for later batches
        targetResponseTime: batchNumber.current > 1 ? 10000 : 15000 // 15s for first batch, 10s for later batches
      };
      
      callback(continuationPrompt, batchOptions);
    }
  }, [batchingPrompt, autoBatch]);
  
  const handleBatchResult = useCallback((truncated: boolean, queryText: string, autoBatchMode: boolean, batchNumber: number) => {
    // Mark this batch as completed
    if (batchCompletionTracker.current[batchNumber] !== undefined) {
      batchCompletionTracker.current[batchNumber] = true;
    }
    
    // More aggressive truncation detection for batch triggering
    const needsContinuation = truncated || 
                              queryText.toLowerCase().includes('timetable') || 
                              queryText.toLowerCase().includes('chapter 14a') ||
                              queryText.toLowerCase().includes('connected transaction') ||
                              queryText.toLowerCase().includes('specialists') ||
                              queryText.length > 300; // Long queries likely need batching
    
    if (needsContinuation && autoBatchMode && batchNumber < MAX_AUTO_BATCHES) {
      setIsBatching(true);
      setBatchingPrompt(queryText);
      
      // Automatically continue for auto-batch mode with optimized timing
      // Use progressively shorter delays for subsequent batches
      const delay = Math.max(750 - (batchNumber * 100), 400); // Starts at 750ms, gets faster
      
      setTimeout(() => {
        return { shouldContinue: true, batchNumber: batchNumber, prompt: queryText };
      }, delay);
    } else if (truncated) {
      // Manual batch continuation needed
      setIsBatching(true);
      setBatchingPrompt(queryText);
      
      // Show toast to inform user they need to click continue
      toast({
        title: "Response Continuation Available",
        description: "The complete answer requires additional information. Click 'Continue' for the next part.",
        duration: 10000
      });
    } else {
      // Check if this was the last batch and mark the entire sequence as complete
      const allBatchesComplete = Object.values(batchCompletionTracker.current).every(v => v === true);
      if (allBatchesComplete) {
        // Response is complete
        setIsBatching(false);
        setBatchingPrompt(null);
        // Reset batch tracking
        batchCompletionTracker.current = {};
        
        // Log batch timing statistics
        if (batchTimings.current.length > 0) {
          const totalTime = batchTimings.current.reduce((sum, time) => sum + time, 0);
          console.log(`Completed ${batchTimings.current.length + 1} batches in ${totalTime}ms`);
          console.log(`Average batch time: ${totalTime / (batchTimings.current.length + 1)}ms`);
        }
      } else {
        // Some batches may still be pending
        setIsBatching(true);
      }
    }
    
    return { shouldContinue: false };
  }, [toast]);
  
  return {
    isBatching,
    currentBatchNumber: batchNumber.current,
    autoBatch,
    startBatching,
    handleBatchContinuation,
    handleBatchResult,
    setBatchingPrompt,
    batchingPrompt,
    shouldUseBatchingForQuery
  };
};
