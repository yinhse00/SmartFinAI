
/**
 * Helper utilities for API requests
 */

// Helper function to determine if content is a string or complex object array
export const isStringContent = (content: any): content is string => {
  return typeof content === 'string';
};

/**
 * Extract text from user messages for token management
 */
export const extractPromptText = (userMessage: any): string => {
  if (!userMessage) return '';
  
  if (isStringContent(userMessage.content)) {
    return userMessage.content;
  } else {
    // Concatenate text from array items
    return userMessage.content
      .filter((item: any) => item.type === 'text' && item.text)
      .map((item: any) => item.text)
      .join(' ');
  }
};

/**
 * Detect if a user message contains retry attempt marker
 */
export const isRetryAttempt = (userMessage: any): boolean => {
  if (!userMessage) return false;
  
  if (isStringContent(userMessage.content)) {
    return userMessage.content.includes('[RETRY_ATTEMPT]');
  } else {
    // Check if any text content in the array includes the retry marker
    return userMessage.content.some((item: any) => 
      item.type === 'text' && item.text?.includes('[RETRY_ATTEMPT]')
    );
  }
};
