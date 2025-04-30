
import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { rotateApiKey } from '@/services/apiKeyService';

/**
 * Hook for handling batched responses and API key rotation
 */
export const useBatchHandling = () => {
  const { toast } = useToast();
  const [isBatching, setIsBatching] = useState(false);
  const [currentBatchNumber, setCurrentBatchNumber] = useState(1);
  const [autoBatch, setAutoBatch] = useState(false);
  const [batchingPrompt, setBatchingPrompt] = useState('');
  const [isApiKeyRotating, setIsApiKeyRotating] = useState(false);
  
  // Start a new batch session
  const startBatching = useCallback((initialBatchNumber: number = 1) => {
    setIsBatching(true);
    setCurrentBatchNumber(initialBatchNumber);
    
    toast({
      title: "Batch mode activated",
      description: `Response will be delivered in multiple parts (batch ${initialBatchNumber})`,
    });
  }, [toast]);
  
  // Handle batch continuation with API key rotation
  const handleBatchContinuation = useCallback(async (
    processQueryFn: (query: string, batchInfo?: { batchNumber: number, isContinuing: boolean }) => Promise<void>
  ) => {
    try {
      // Set API key rotation status to true
      setIsApiKeyRotating(true);
      
      // Rotate to a fresh API key to avoid CORS issues
      const freshKey = rotateApiKey();
      console.log(`Rotated to fresh API key for batch continuation (key ID: ${freshKey.substring(0, 8)}...)`);
      
      // Short delay to allow API key rotation to complete
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Increment batch number
      const nextBatchNumber = currentBatchNumber + 1;
      setCurrentBatchNumber(nextBatchNumber);
      
      // Execute continuation query
      const continuationPrompt = batchingPrompt || '[CONTINUE_RESPONSE]';
      await processQueryFn(continuationPrompt, { 
        batchNumber: nextBatchNumber, 
        isContinuing: true 
      });
      
      toast({
        title: `Continuing with batch ${nextBatchNumber}`,
        description: "Using a fresh API key to avoid rate limits",
      });
    } catch (error) {
      console.error('Error in batch continuation:', error);
      toast({
        title: "Batch continuation failed",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive"
      });
    } finally {
      // Reset API key rotation status
      setTimeout(() => setIsApiKeyRotating(false), 1500);
    }
  }, [batchingPrompt, currentBatchNumber, toast]);
  
  // Process batch results
  const handleBatchResult = useCallback((
    isTruncated: boolean, 
    shouldAutoContinue: boolean = false
  ) => {
    if (isTruncated) {
      if (shouldAutoContinue || autoBatch) {
        // Auto-continue logic would go here
        console.log("Auto-continuation would be triggered here if implemented");
      } else {
        toast({
          title: "Response truncated",
          description: "The response was too long. Click 'Continue' to receive the next part.",
        });
      }
    } else {
      // End batching if the response is complete
      setIsBatching(false);
      setCurrentBatchNumber(1);
    }
  }, [autoBatch, toast]);

  return {
    isBatching,
    currentBatchNumber,
    autoBatch,
    isApiKeyRotating,
    startBatching,
    handleBatchContinuation,
    handleBatchResult,
    setBatchingPrompt,
    batchingPrompt
  };
};
