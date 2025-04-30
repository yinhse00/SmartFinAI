
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
      console.log("Empty response detected as fallback");
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
      "unable to connect to my financial expertise service",
      "network connectivity issues or service maintenance",
      "API authentication",
      "API key",
      "connectivity issues",
      "until the connection is restored",
      "try again in a few moments",
      "offline mode",
      "operating in offline mode",
      "network error",
      "API is unreachable"
    ];
    
    // Check for any fallback indicators - case insensitive
    const hasIndicator = fallbackIndicators.some(indicator => 
      responseText.toLowerCase().includes(indicator.toLowerCase())
    );
    
    // Enhanced metadata detection with multiple formats for more reliable detection
    const hasMetadataText = responseText.includes('"metadata"') || responseText.includes('metadata:');
    
    // More aggressive fallback detection - any metadata text might indicate a fallback
    const hasFallbackMetadata = 
      hasMetadataText && (
        responseText.includes('"isBackupResponse"') || 
        responseText.includes('"error"') || 
        responseText.includes("isBackupResponse:") ||
        responseText.includes("error:") ||
        responseText.includes('"isOfflineMode"') ||
        responseText.includes("isOfflineMode:")
      );
    
    // Enhanced fallback detection with more specific indicators
    const hasObviousFallbackMarkers =
      responseText.includes('I can only offer general guidance') ||
      responseText.includes('based on my core knowledge') ||
      (responseText.includes('technical difficulties') && responseText.includes('try again')) ||
      responseText.includes('I\'m currently using a fallback response mode') ||
      responseText.includes('offline mode') ||
      responseText.includes('I\'m currently in offline mode') ||
      // Check for suspiciously short responses to complex financial queries
      (responseText.length < 150 && responseText.includes('Hong Kong'));
    
    // Log detection results for debugging
    if (hasIndicator || hasFallbackMetadata || hasObviousFallbackMarkers) {
      console.log("Fallback response detected:", {
        hasIndicator,
        hasFallbackMetadata,
        hasObviousFallbackMarkers,
        responseLength: responseText.length,
        responseSnippet: responseText.substring(0, 50) + "...",
        fallbackIndicatorsFound: fallbackIndicators.filter(indicator => 
          responseText.toLowerCase().includes(indicator.toLowerCase())
        )
      });
    }
    
    return hasIndicator || hasFallbackMetadata || hasObviousFallbackMarkers;
  };

  return {
    isFallbackResponse
  };
};
