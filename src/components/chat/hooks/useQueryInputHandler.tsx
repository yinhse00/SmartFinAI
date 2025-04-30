
/**
 * Hook for handling query input interactions
 */
export const useQueryInputHandler = (
  processQuery: (query: string, options?: { isBatchContinuation?: boolean }) => Promise<void>,
  input: string
) => {
  const handleSend = async () => {
    // No pre-translation here - just process the raw input
    await processQuery(input);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSend();
    }
  };

  return {
    handleSend,
    handleKeyDown
  };
};
