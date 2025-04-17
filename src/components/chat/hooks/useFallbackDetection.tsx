
/**
 * Hook for detecting when fallback responses are being used
 */
export const useFallbackDetection = () => {
  const isFallbackResponse = (responseText: string): boolean => {
    // If response is empty or undefined, it's definitely a fallback scenario
    if (!responseText || responseText.trim() === '') {
      return true;
    }
    
    // Use consistent fallback indicators across all environments
    const fallbackIndicators = [
      "Cannot connect to financial expertise service",
      "Failed to connect to financial expertise service",
      "database connection failed",
      "connection issue",
      "Unable to access financial database",
      "I'm currently experiencing some technical difficulties",
      "technical difficulties accessing my full knowledge database",
      "I apologize, but I encountered an issue",
      "Please try your query again in a few moments"
    ];
    
    // Check for any fallback indicators
    const hasIndicator = fallbackIndicators.some(indicator => 
      responseText.toLowerCase().includes(indicator.toLowerCase())
    );
    
    // Check metadata - ensure this is consistent across environments
    const hasFallbackMetadata = responseText.includes('"isBackupResponse": true') || 
                              responseText.includes('"isBackupResponse":true') ||
                              responseText.includes('"fallback": true') ||
                              responseText.includes('"isBackupResponse":true') ||
                              responseText.includes('"isBackupResponse": true');
    
    return hasIndicator || hasFallbackMetadata;
  };

  return {
    isFallbackResponse
  };
};
