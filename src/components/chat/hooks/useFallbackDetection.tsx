
/**
 * Hook for detecting when fallback responses are being used
 */
export const useFallbackDetection = () => {
  /**
   * Check if a response is a fallback/backup response
   * FIXED: Use consistent detection logic across all environments
   */
  const isFallbackResponse = (responseText: string): boolean => {
    // If response is empty or undefined, it's definitely a fallback scenario
    if (!responseText || responseText.trim() === '') {
      return true;
    }
    
    // List of fallback indicators that might appear in the response text
    const fallbackIndicators = [
      "Cannot connect to financial expertise service",
      "Failed to connect to financial expertise service",
      "database connection failed",
      "connection issue",
      "Unable to access financial database",
      "I'm currently experiencing some technical difficulties",
      "technical difficulties accessing my full knowledge database",
      "I apologize, but I encountered an issue",
      "Please try your query again in a few moments",
      "service is temporarily unavailable",
      "could not access the regulatory database",
      "financial database is currently unavailable",
      "unable to retrieve complete information at this time",
      "This is a mock response", // Add mock response detection
      "mock response from the Grok API" // Add explicit mock response text detection
    ];
    
    // Check for any fallback indicators
    const hasIndicator = fallbackIndicators.some(indicator => 
      responseText.toLowerCase().includes(indicator.toLowerCase())
    );
    
    // Check for fallback metadata indicators with consistent detection across environments
    const hasFallbackMetadata = 
      responseText.includes('"isBackupResponse": true') || 
      responseText.includes('"isBackupResponse":true') ||
      responseText.includes('"fallback": true') ||
      responseText.includes('fallback response') ||
      responseText.includes('mock response');  // Add explicit mock detection
    
    return hasIndicator || hasFallbackMetadata;
  };

  return {
    isFallbackResponse
  };
};
