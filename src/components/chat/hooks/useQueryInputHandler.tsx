
/**
 * Hook for handling query input interactions
 */
export const useQueryInputHandler = (
  processQuery: (query: string, options?: { isBatchContinuation?: boolean }) => Promise<void>,
  input: string
) => {
  const handleSend = () => {
    if (input.trim()) {
      processQuery(input);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && input.trim()) {
      e.preventDefault();
      handleSend();
    }
  };

  return {
    handleSend,
    handleKeyDown
  };
};
