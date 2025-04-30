
import { useRef, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { tokenManagementService } from '@/services/response/modules/tokenManagementService';

/**
 * Enhanced hook to manage batch/multi-part response functionality
 */
export const useBatchHandling = () => {
  const { toast } = useToast();
  const batchNumber = useRef(1);
  const [isBatching, setIsBatching] = useState(false);
  const [batchingPrompt, setBatchingPrompt] = useState<string | null>(null);
  const [autoBatch, setAutoBatch] = useState(true);
  const MAX_AUTO_BATCHES = 8; // Increased from 5 for more comprehensive responses
  
  const startBatching = (prompt: string, autoBatchMode = true) => {
    setBatchingPrompt(prompt);
    batchNumber.current = 1;
    setIsBatching(false);
    setAutoBatch(autoBatchMode);
  };
  
  const handleBatchContinuation = async (callback: (query: string, options: any) => Promise<void>) => {
    if (batchingPrompt) {
      batchNumber.current += 1;
      // Add continuation marker to help the API understand this is continuing a previous response
      const continuationPrompt = `${batchingPrompt} [CONTINUATION_PART_${batchNumber.current}]`;
      
      // Let the user know we're fetching the next batch
      toast({
        title: `Fetching part ${batchNumber.current}`,
        description: "Using API key rotation for optimal performance...",
        duration: 3000
      });
      
      await callback(continuationPrompt, { 
        isBatchContinuation: true, 
        batchNumber: batchNumber.current, 
        autoBatch 
      });
    }
  };
  
  const handleBatchResult = (truncated: boolean, queryText: string, autoBatchMode: boolean, queryType = 'general') => {
    // Use token management service to help determine if batching is needed
    const needsContinuation = truncated || tokenManagementService.shouldUseBatching(queryText, queryType);
    
    if (needsContinuation && autoBatchMode && batchNumber.current < MAX_AUTO_BATCHES) {
      setIsBatching(true);
      setBatchingPrompt(queryText);
      
      // Automatically continue for auto-batch mode with a short delay
      setTimeout(() => {
        return { shouldContinue: true, batchNumber: batchNumber.current, prompt: queryText };
      }, 750);
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
      // Response is complete
      setIsBatching(false);
      setBatchingPrompt(null);
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
