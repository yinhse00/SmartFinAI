
import { Message } from '../ChatMessage';

/**
 * Hook for handling query input interactions
 */
export const useQueryInputHandler = (
  processQuery: (query: string, options?: { isBatchContinuation?: boolean }) => Promise<void>,
  input: string
) => {
  const handleSend = async () => {
    // No pre-translation here - just process the raw input
    if (input.trim()) {
      await processQuery(input);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement | HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (input.trim()) {
        handleSend();
      }
    }
  };

  return {
    handleSend,
    handleKeyDown
  };
};
