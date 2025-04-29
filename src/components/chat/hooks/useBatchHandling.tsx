
import { useRef, useState } from 'react';
import { useToast } from '@/hooks/use-toast';

/**
 * Hook to manage batch/multi-part response functionality
 */
export const useBatchHandling = () => {
  const { toast } = useToast();
  const batchNumber = useRef(1);
  const [isBatching, setIsBatching] = useState(false);
  const [batchingPrompt, setBatchingPrompt] = useState<string | null>(null);
  const [autoBatch, setAutoBatch] = useState(true);
  const MAX_AUTO_BATCHES = 4;
  
  const startBatching = (prompt: string, autoBatchMode = true) => {
    setBatchingPrompt(prompt);
    batchNumber.current = 1;
    setIsBatching(false);
    setAutoBatch(autoBatchMode);
  };
  
  const handleBatchContinuation = (callback: (query: string, options: any) => Promise<void>) => {
    if (batchingPrompt) {
      batchNumber.current += 1;
      callback(batchingPrompt, { isBatchContinuation: true, autoBatch });
    }
  };
  
  const handleBatchResult = (truncated: boolean, queryText: string, autoBatchMode: boolean) => {
    if (truncated && autoBatchMode && batchNumber.current < MAX_AUTO_BATCHES) {
      setIsBatching(true);
      setTimeout(() => {
        batchNumber.current += 1;
        return { shouldContinue: true, batchNumber: batchNumber.current, prompt: queryText };
      }, 750);
    } else if (truncated) {
      setIsBatching(true);
    } else {
      setIsBatching(false);
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
