/**
 * Utility for cleaning markdown code block markers from AI responses
 */
export const codeBlockCleaner = {
  /**
   * Remove markdown code block markers from AI responses
   * Targets patterns like ```html, ```, ```text while preserving actual content
   */
  cleanupCodeBlockMarkers: (text: string): string => {
    if (!text || typeof text !== 'string') {
      return text;
    }

    let cleanedText = text;

    // Remove opening code block markers (```html, ```text, ```javascript, etc.)
    // This pattern matches ``` followed by optional language identifier at start of line
    cleanedText = cleanedText.replace(/^```\w*\s*\n?/gm, '');

    // Remove closing code block markers (standalone ``` at end)
    // This pattern matches ``` at the end of line or end of string
    cleanedText = cleanedText.replace(/\n?```\s*$/gm, '');

    // Clean up any remaining standalone ``` that might be floating
    // Only remove if they appear to be wrapper markers, not content
    cleanedText = cleanedText.replace(/^\s*```\s*$/gm, '');

    // Remove any leading/trailing whitespace that might be left after cleanup
    cleanedText = cleanedText.trim();

    return cleanedText;
  }
};