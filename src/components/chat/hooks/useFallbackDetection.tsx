
/**
 * Hook for detecting when fallback responses are being used
 */
export const useFallbackDetection = () => {
  const isFallbackResponse = (responseText: string): boolean => {
    // If response is empty or undefined, it's definitely a fallback scenario
    if (!responseText || responseText.trim() === '') {
      return true;
    }
    
    // CRITICAL FIX: Only detect known fallback phrases, not general content patterns
    // This prevents false positives on legitimate responses
    const fallbackIndicators = [
      "I encountered an error",
      "connection issue",
      "I'm sorry, I couldn't",
      "database connection failed",
      "Unable to access financial database",
      "Cannot connect to financial expertise services",
      "Failed to connect to financial expertise service"
    ];
    
    // Check if any fallback indicator is present in the response
    const hasIndicator = fallbackIndicators.some(indicator => 
      responseText.toLowerCase().includes(indicator.toLowerCase())
    );
    
    // Check for metadata flag indicating this is a fallback response
    const hasFallbackMetadata = responseText.includes('"isBackupResponse": true') || 
                              responseText.includes('"isBackupResponse":true') ||
                              responseText.includes('"fallback": true');
    
    return hasIndicator || hasFallbackMetadata;
  };

  return {
    isFallbackResponse
  };
};
