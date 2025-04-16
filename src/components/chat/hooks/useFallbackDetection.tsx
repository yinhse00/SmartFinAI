
/**
 * Hook for detecting when fallback responses are being used
 */
export const useFallbackDetection = () => {
  const isFallbackResponse = (responseText: string): boolean => {
    const fallbackIndicators = [
      "Based on your query about",
      "Regarding your query about",
      "In response to your query",
      // Add more specific phrases that appear in fallback responses
      "Hong Kong listed companies must comply",
      "The Securities and Futures Ordinance (SFO) is the primary legislation"
    ];
    
    // Check if any fallback indicator is present in the response
    return fallbackIndicators.some(indicator => responseText.includes(indicator));
  };

  return {
    isFallbackResponse
  };
};
