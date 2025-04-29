
/**
 * Handles API request retries with backoff
 */

/**
 * Execute a function with retry logic and exponential backoff
 */
export const executeWithRetry = async <T>(
  operation: () => Promise<T>,
  maxRetries: number = 2
): Promise<T> => {
  let retries = 0;
  let lastError = null;
  
  while (retries <= maxRetries) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      retries++;
      
      console.error("API call attempt failed details:", {
        attempt: retries,
        errorType: error instanceof Error ? error.name : "Unknown",
        errorMsg: error instanceof Error ? error.message : String(error)
      });
      
      if (retries <= maxRetries) {
        const backoffTime = Math.min(1000 * Math.pow(2, retries - 1), 8000);
        console.log(`Retrying in ${Math.round(backoffTime/1000)} seconds...`);
        await new Promise(resolve => setTimeout(resolve, backoffTime));
      } else {
        console.error("API call failed after all retries:", error);
        throw lastError || new Error("API call failed after maximum retries");
      }
    }
  }
  
  throw lastError || new Error("API call failed after maximum retries");
};
