
/**
 * Hook for detecting when fallback responses are being used
 */
export const useFallbackDetection = () => {
  const isFallbackResponse = (responseText: string): boolean => {
    // If response is empty or undefined, it's definitely a fallback scenario
    if (!responseText || responseText.trim() === '') {
      return true;
    }
    
    const fallbackIndicators = [
      "Based on your query about",
      "Regarding your query about",
      "In response to your query",
      // Specific phrases from fallback responses
      "Hong Kong listed companies must comply",
      "The Securities and Futures Ordinance (SFO) is the primary legislation",
      // Common fallback phrases
      "For specific regulatory guidance on your issue",
      "For specific guidance on your situation",
      "The Hong Kong Listing Rules are primarily found",
      "The Hong Kong Exchanges and Clearing Limited (HKEX) sets listing rules",
      // Common error-related phrases in fallbacks
      "I encountered an error",
      "connection issue",
      "I'm sorry, I couldn't",
      // Check for database connection failure indicators
      "I'm sorry, I couldn't connect to the database",
      "database connection failed",
      "Unable to access financial database"
    ];
    
    // Additional pattern check for fallback structures
    const fallbackPatterns = [
      /^(Regarding|In response to|Based on) your query about .{10,40}(, here|:)/i,
      /^The (Hong Kong|HK) (Listing Rules|SFC|Securities and Futures Commission)/i,
      /^(Hong Kong|HK) listed companies must comply with/i
    ];
    
    // Check if any fallback indicator is present in the response
    const hasIndicator = fallbackIndicators.some(indicator => responseText.includes(indicator));
    
    // Check if any fallback pattern matches
    const hasPattern = fallbackPatterns.some(pattern => pattern.test(responseText));
    
    // Check for metadata flag indicating this is a fallback response
    const hasFallbackMetadata = responseText.includes('"isBackupResponse": true') || 
                              responseText.includes('"isBackupResponse":true');
    
    return hasIndicator || hasPattern || hasFallbackMetadata;
  };

  return {
    isFallbackResponse
  };
};
