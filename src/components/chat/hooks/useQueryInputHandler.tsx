
/**
 * Hook for handling query input interactions
 */
export const useQueryInputHandler = (
  processQuery: (query: string, options?: { isBatchContinuation?: boolean }) => Promise<void>,
  input: string
) => {
  const handleSend = async () => {
    // Check if input contains Chinese characters
    const containsChinese = /[\u4e00-\u9fa5]/.test(input);
    
    if (containsChinese) {
      try {
        // Import dynamically to avoid circular dependencies
        const { translationService } = await import('../../../services/translation/translationService');
        
        // Translate Chinese to English
        const translatedInput = await translationService.translateContent({
          content: input,
          sourceLanguage: 'zh',
          targetLanguage: 'en'
        });
        
        // Process the translated query
        await processQuery(translatedInput.text);
      } catch (error) {
        console.error('Translation error in handleSend:', error);
        await processQuery(input); // Fallback to original input
      }
    } else {
      await processQuery(input);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSend();
    }
  };

  return {
    handleSend,
    handleKeyDown
  };
};
