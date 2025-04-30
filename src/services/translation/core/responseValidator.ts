
/**
 * Validates translation responses
 */
export const responseValidator = {
  /**
   * Validates the quality of a translation
   */
  validateTranslation(
    originalContent: string,
    translatedContent: string,
    sourceLanguage: 'en' | 'zh',
    targetLanguage: 'en' | 'zh'
  ): { 
    isValid: boolean; 
    needsRetry: boolean; 
    issues?: string[];
  } {
    // Verify we got a reasonable translation (not empty or substantially shorter)
    if (!translatedContent || translatedContent.trim().length === 0) {
      console.error('Empty translation received');
      return {
        isValid: false,
        needsRetry: true,
        issues: ['Empty translation received']
      };
    }
    
    // Check if translation is suspiciously short (could indicate truncation)
    const originalLength = originalContent.length;
    const translatedLength = translatedContent.length;
    const lengthRatio = translatedLength / originalLength;
    
    console.log(`Translation metrics - Original: ${originalLength} chars, Translated: ${translatedLength} chars, Ratio: ${lengthRatio.toFixed(2)}`);
    
    // For Chinese to English, reasonable ratio is ~1.5-2.5
    // For English to Chinese, reasonable ratio is ~0.5-0.9
    const isEnToCh = sourceLanguage === 'en' && targetLanguage === 'zh';
    const isChToEn = sourceLanguage === 'zh' && targetLanguage === 'en';
    
    const suspiciouslyShort = (isEnToCh && lengthRatio < 0.4) || (isChToEn && lengthRatio < 1.0);
    
    if (suspiciouslyShort) {
      console.warn(`Suspicious translation length ratio (${lengthRatio.toFixed(2)}), may indicate truncation or incomplete translation`);
      return {
        isValid: true, // Still valid but flagged
        needsRetry: true,
        issues: [`Suspicious length ratio: ${lengthRatio.toFixed(2)}`]
      };
    }
    
    return {
      isValid: true,
      needsRetry: false
    };
  }
};
