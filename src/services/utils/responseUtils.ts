
/**
 * Utility function to safely extract text from API responses
 * This handles all potential response formats and null values
 */
export const safelyExtractText = (response: any): string => {
  if (!response) return '';
  
  if (typeof response === 'string') return response;
  
  if (typeof response === 'object') {
    if ('text' in response && response.text) {
      return typeof response.text === 'string' ? response.text : '';
    }
    
    // Handle case where response might have other text fields
    if ('content' in response && response.content) {
      return typeof response.content === 'string' ? response.content : '';
    }
  }
  
  return '';
};
