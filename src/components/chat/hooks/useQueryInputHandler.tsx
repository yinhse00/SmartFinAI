
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
      try {
        console.log('Processing query:', input.trim());
        await processQuery(input);
      } catch (error) {
        console.error('Error processing query:', error);
      }
    } else {
      console.log('Empty input, not processing');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement | HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (input.trim()) {
        console.log('Enter key pressed, sending query');
        handleSend();
      }
    }
  };

  return {
    handleSend,
    handleKeyDown
  };
};
