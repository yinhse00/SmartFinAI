
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
    // Extract useful error information
    let errorDetails = "Unknown error";
    let errorType = "Unknown";
    
    if (error) {
      if (error instanceof Error) {
        errorType = error.name;
        errorDetails = `${error.name}: ${error.message}`;
        // Include stack trace in dev environment only
        if (process.env.NODE_ENV === 'development' && error.stack) {
          console.debug("Error stack trace:", error.stack);
        }
      } else if (typeof error === 'string') {
        errorDetails = error;
        errorType = error.includes('CORS') ? 'CORSError' : 
                    error.includes('timeout') ? 'TimeoutError' : 'StringError';
      } else {
        try {
          errorDetails = JSON.stringify(error);
          errorType = 'JSONError';
        } catch {
          errorDetails = String(error);
          errorType = 'NonSerializableError';
        }
      }
    }
      
    console.warn(`Using offline response format due to: ${errorDetails}`);
    
    // Analyze the prompt to provide more specific offline response
    const isSimpleQuestion = prompt.length < 50;
    const mentionsFinancial = prompt.toLowerCase().includes('financ') || 
                            prompt.toLowerCase().includes('hong kong') ||
                            prompt.toLowerCase().includes('regulation');
                            
    // Create appropriate response based on prompt type
    let responseContent = "I'm currently experiencing connectivity issues and cannot access the full knowledge database. I can only provide general guidance based on my core knowledge. Please try again later when the connection is restored.";
    
    if (mentionsFinancial) {
      responseContent = "I'm currently experiencing connectivity issues and cannot access my Hong Kong financial regulatory database. I can only provide general guidance based on my core knowledge, but specific regulatory details may be unavailable. Please try again later when the connection is restored.";
    }
    
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
            content: responseContent
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
        error: errorDetails,
        errorType,
        timestamp: new Date().toISOString()
      },
      // Use standardized text format for better handling by UI components
      text: responseContent
    };
  }
};
