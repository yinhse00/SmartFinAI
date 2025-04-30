
import { grokService } from '@/services/grokService';
import { useState } from 'react';

export const useTranslationHandler = () => {
  const [translating, setTranslating] = useState(false);

  // Translate content between languages
  const translateContent = async (
    content: string,
    fromChinese: boolean
  ): Promise<string> => {
    setTranslating(true);
    
    try {
      if (!content.trim()) {
        return content;
      }
      
      if (fromChinese) {
        // Chinese to English translation
        const translation = await grokService.translateContent({
          content,
          sourceLanguage: 'zh',
          targetLanguage: 'en'
        });
        
        return translation && translation.text ? translation.text : content;
      } else {
        // English to Chinese translation
        const translation = await grokService.translateContent({
          content,
          sourceLanguage: 'en',
          targetLanguage: 'zh'
        });
        
        return translation && translation.text ? translation.text : content;
      }
    } catch (error) {
      console.error('Translation error:', error);
      return content; // Return original on error
    } finally {
      setTranslating(false);
    }
  };

  // Helper to detect simplified vs traditional Chinese
  const isSimplifiedChinese = (text: string): boolean => {
    // This is a simplified check - a more accurate implementation would check for 
    // specific simplified Chinese characters that differ from traditional
    const simplifiedChars = '简体中文销售专业谁见';
    const traditionalChars = '繁體中文銷售專業誰見';
    
    let simplifiedCount = 0;
    let traditionalCount = 0;
    
    for (const char of text) {
      if (simplifiedChars.includes(char)) simplifiedCount++;
      if (traditionalChars.includes(char)) traditionalCount++;
    }
    
    return simplifiedCount > traditionalCount;
  };

  return {
    translateContent,
    isSimplifiedChinese,
    translating
  };
};
