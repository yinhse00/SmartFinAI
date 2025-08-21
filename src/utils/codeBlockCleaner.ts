/**
 * Utility for cleaning up markdown code block markers from AI responses
 */
export const codeBlockCleaner = {
  /**
   * Removes markdown code block wrappers while preserving content
   * Targets patterns like ```html, ```, and other code block variations
   */
  cleanupCodeBlockMarkers: (text: string): string => {
    if (!text || typeof text !== 'string') {
      return text;
    }

    // Remove opening code block markers (```html, ```text, ```, etc.)
    let cleaned = text.replace(/^```(?:html|text|markdown|md)?\s*\n?/gim, '');
    
    // Remove closing code block markers
    cleaned = cleaned.replace(/\n?```\s*$/gim, '');
    
    // Clean up any standalone ``` markers that might be left
    cleaned = cleaned.replace(/^```\s*$/gm, '');
    
    // Trim any extra whitespace from start and end
    cleaned = cleaned.trim();
    
    return cleaned;
  }
};