
import { useRef, useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

/**
 * Hook to manage seamless batch/multi-part response functionality
 */
export const useBatchHandling = () => {
  const { toast } = useToast();
  const batchNumber = useRef(1);
  const [isBatching, setIsBatching] = useState(false);
  const [batchingPrompt, setBatchingPrompt] = useState<string | null>(null);
  const [autoBatch, setAutoBatch] = useState(true);
  const MAX_AUTO_BATCHES = 10; // Increased from 5 to 10 for better completion
  const batchCompletionTracker = useRef<Record<number, boolean>>({});
  const nextBatchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (nextBatchTimeoutRef.current) {
        clearTimeout(nextBatchTimeoutRef.current);
      }
    };
  }, []);
  
  const startBatching = (prompt: string, autoBatchMode = true) => {
    setBatchingPrompt(prompt);
    batchNumber.current = 1;
    setIsBatching(false);
    setAutoBatch(autoBatchMode);
    // Reset batch completion tracker
    batchCompletionTracker.current = {1: false};
  };
  
  const handleBatchContinuation = (callback: (query: string, options: any) => Promise<void>) => {
    if (batchingPrompt) {
      batchNumber.current += 1;
      // Track this batch as not completed yet
      batchCompletionTracker.current[batchNumber.current] = false;
      
      // Add continuation marker to help the API understand this is continuing a previous response
      // But use a different format that doesn't show in the UI
      const continuationPrompt = `${batchingPrompt} [CONTINUATION_PART_${batchNumber.current}]`;
      callback(continuationPrompt, { 
        isBatchContinuation: true, 
        batchNumber: batchNumber.current, 
        autoBatch, 
        isSeamlessBatch: true  // New flag to indicate this should be rendered seamlessly
      });
    }
  };
  
  const handleBatchResult = (
    truncated: boolean, 
    queryText: string, 
    autoBatchMode: boolean, 
    batchNumber: number
  ) => {
    // Mark this batch as completed
    if (batchCompletionTracker.current[batchNumber] !== undefined) {
      batchCompletionTracker.current[batchNumber] = true;
    }
    
    // More aggressive truncation detection for batch triggering
    const needsContinuation = truncated || 
                              queryText.toLowerCase().includes('timetable') || 
                              queryText.toLowerCase().includes('chapter 14a') ||
                              queryText.toLowerCase().includes('connected transaction') ||
                              queryText.length > 300; // Long queries likely need batching
    
    // Handle auto-batching more seamlessly
    if (needsContinuation && autoBatchMode && batchNumber < MAX_AUTO_BATCHES) {
      setIsBatching(true);
      setBatchingPrompt(queryText);
      
      // Automatically continue for auto-batch mode with a variable delay
      // Use shorter delay for earlier batches, longer for later ones
      const batchDelay = Math.min(750 + (batchNumber * 100), 1500);
      
      // Clear any existing timeout
      if (nextBatchTimeoutRef.current) {
        clearTimeout(nextBatchTimeoutRef.current);
      }
      
      nextBatchTimeoutRef.current = setTimeout(() => {
        return { shouldContinue: true, batchNumber: batchNumber, prompt: queryText };
      }, batchDelay);
      
    } else if (truncated) {
      // Manual batch continuation needed
      setIsBatching(true);
      setBatchingPrompt(queryText);
      
      // Show minimal toast to inform user they need to click continue
      toast({
        title: "Additional information available",
        description: "Click 'Continue' for the next part of the answer.",
        duration: 8000
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
        
        // Clear any pending batch timeouts
        if (nextBatchTimeoutRef.current) {
          clearTimeout(nextBatchTimeoutRef.current);
          nextBatchTimeoutRef.current = null;
        }
      } else {
        // Some batches may still be pending
        setIsBatching(true);
      }
    }
    
    return { shouldContinue: false };
  };
  
  return {
    isBatching,
    currentBatchNumber: batchNumber.current,
    autoBatch,
    startBatching,
    handleBatchContinuation,
    handleBatchResult,
    setBatchingPrompt,
    batchingPrompt
  };
};
