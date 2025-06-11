
export const useQueryUtils = () => {
  // Helper method to identify simple queries for fast path
  const isSimpleQuery = (query: string): boolean => {
    const simplePatterns = [
      /^what is/i,
      /^define/i,
      /^meaning of/i,
      /^\w+\s+definition/i,
      /^how to calculate/i,
      /^when is/i,
      /^where can I find/i
    ];
    
    return simplePatterns.some(pattern => pattern.test(query)) || query.length < 50;
  };

  return {
    isSimpleQuery
  };
};
