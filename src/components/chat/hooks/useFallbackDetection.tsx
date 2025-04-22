
/**
 * Hook for detecting when fallback responses are being used
 */
export const useFallbackDetection = () => {
  /**
   * Check if a response is a fallback/backup response
   * Uses consistent detection logic across all environments
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
      "unable to retrieve complete information at this time"
    ];
    
    // Check for any fallback indicators
    const hasIndicator = fallbackIndicators.some(indicator => 
      responseText.toLowerCase().includes(indicator.toLowerCase())
    );
    
    // Enhanced metadata detection with multiple formats
    const hasFallbackMetadata = 
      responseText.includes('"isBackupResponse": true') || 
      responseText.includes('"isBackupResponse":true') ||
      responseText.includes('"fallback": true') ||
      responseText.includes('fallback response') ||
      responseText.includes('backup response');
    
    // Enhanced fallback detection with more specific indicators
    const hasObviousFallbackMarkers =
      responseText.includes('I can only offer general guidance') ||
      responseText.includes('based on my core knowledge') ||
      (responseText.includes('technical difficulties') && responseText.includes('try again')) ||
      responseText.includes('I\'m currently using a fallback response mode');
    
    // Log detection results for debugging
    if (hasIndicator || hasFallbackMetadata || hasObviousFallbackMarkers) {
      console.log("Fallback response detected:", {
        hasIndicator,
        hasFallbackMetadata,
        hasObviousFallbackMarkers,
        responseLength: responseText.length,
        responseSnippet: responseText.substring(0, 50) + "..."
      });
    }
    
    return hasIndicator || hasFallbackMetadata || hasObviousFallbackMarkers;
  };

  return {
    isFallbackResponse
  };
};
