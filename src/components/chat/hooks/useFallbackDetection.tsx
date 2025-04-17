
/**
 * Hook for detecting when fallback responses are being used
 */
export const useFallbackDetection = () => {
  const isFallbackResponse = (responseText: string): boolean => {
    // If response is empty or undefined, it's definitely a fallback scenario
    if (!responseText || responseText.trim() === '') {
      return true;
    }
    
    // CRITICAL FIX: Only detect explicit fallback phrases
    // Use minimal set of indicators to prevent false positives in production
    const fallbackIndicators = [
      "Cannot connect to financial expertise service",
      "Failed to connect to financial expertise service",
      "database connection failed",
      "connection issue",
      "Unable to access financial database"
    ];
    
    // Look for exact fallback phrases only
    const hasExactIndicator = fallbackIndicators.some(indicator => 
      responseText.toLowerCase().includes(indicator.toLowerCase())
    );
    
    // Check metadata - this is reliable across environments
    const hasFallbackMetadata = responseText.includes('"isBackupResponse": true') || 
                              responseText.includes('"isBackupResponse":true') ||
                              responseText.includes('"fallback": true');
    
    return hasExactIndicator || hasFallbackMetadata;
  };

  return {
    isFallbackResponse
  };
};
