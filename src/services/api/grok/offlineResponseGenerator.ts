/**
 * Enhanced offline response generator
 * Creates standardized responses when API services are unavailable
 */
export const offlineResponseGenerator = {
  /**
   * Generate a formatted response for offline mode
   * @param prompt - The user's original prompt
   * @param error - Optional error that triggered offline mode
   * @returns A standard response format with offline indication
   */
  generateOfflineResponseFormat: (prompt: string, error?: any): any => {
    const errorDetails = error instanceof Error 
      ? `(${error.name}: ${error.message})` 
      : error ? String(error) : "Unknown error";
      
    console.warn(`Using offline response format due to: ${errorDetails}`);
    
    // Return data in the same format as a successful API response
    return {
      id: `offline-${Date.now()}`,
      object: "chat.completion",
      created: Date.now(),
      model: "offline-fallback",
      choices: [
        {
          index: 0,
          message: {
            role: "assistant",
            content: "I'm currently experiencing connectivity issues and cannot access the full knowledge database. I can only provide general guidance based on my core knowledge. Please try again later when the connection is restored."
          },
          finish_reason: "stop"
        }
      ],
      usage: {
        prompt_tokens: 0,
        completion_tokens: 0,
        total_tokens: 0
      },
      // Add metadata to indicate this is an offline response
      metadata: {
        isOfflineMode: true,
        isBackupResponse: true,
        error: errorDetails
      },
      // Use standardized text format for better handling by UI components
      text: "I'm currently experiencing connectivity issues and cannot access the full knowledge database. I can only provide general guidance based on my core knowledge. Please try again later when the connection is restored."
    };
  }
};
