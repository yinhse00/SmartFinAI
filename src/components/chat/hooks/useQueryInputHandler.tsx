
/**
 * Hook for handling query input interactions
 */
export const useQueryInputHandler = (
  processQuery: (query: string) => Promise<void>,
  input: string
) => {
  const handleSend = () => {
    processQuery(input);
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
