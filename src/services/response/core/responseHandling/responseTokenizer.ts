
/**
 * Manages token limits for responses
 */
export const responseTokenizer = {
  /**
   * Check if response needs to be truncated due to token limits
   * Returns a message to be appended to the response if truncation occurred
   */
  checkAndHandleTokenLimit: (responseText: string, tokenCount: number): {
    truncated: boolean,
    text: string
  } => {
    // Define a reasonable token limit constant as a baseline
    const DEFAULT_TOKEN_LIMIT = 30000;
    
    // If token count is near limit, mark as truncated
    if (tokenCount > DEFAULT_TOKEN_LIMIT * 0.95) {
      console.log(`Response near token limit (${tokenCount}), marking as truncated`);
      const truncationMessage = "\n\n[NOTE: Response has been truncated due to token limit. This represents the analysis completed so far.]";
      return {
        truncated: true,
        text: responseText + truncationMessage
      };
    }
    // No truncation needed
    return {
      truncated: false,
      text: responseText
    };
  }
};
