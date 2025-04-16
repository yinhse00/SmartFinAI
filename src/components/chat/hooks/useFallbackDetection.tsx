
/**
 * Hook for detecting when fallback responses are being used
 */
export const useFallbackDetection = () => {
  const isFallbackResponse = (responseText: string): boolean => {
    return responseText.includes("Based on your query about") || 
           responseText.includes("Regarding your query about") ||
           responseText.includes("In response to your query");
  };

  return {
    isFallbackResponse
  };
};
