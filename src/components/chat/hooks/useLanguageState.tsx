
import { useState } from 'react';

/**
 * Enhanced hook to manage language state with specialized Chinese detection
 */
export const useLanguageState = () => {
  const [lastInputWasChinese, setLastInputWasChinese] = useState(false);
  const [originalChineseQuery, setOriginalChineseQuery] = useState<string | null>(null);
  const [translatedQuery, setTranslatedQuery] = useState<string | null>(null);
  
  const checkIsChineseInput = (input: string): boolean => {
    const containsChinese = /[\u4e00-\u9fa5]/.test(input);
    setLastInputWasChinese(containsChinese);
    
    if (containsChinese) {
      setOriginalChineseQuery(input);
    } else {
      setOriginalChineseQuery(null);
    }
    
    return containsChinese;
  };
  
  const storeTranslation = (original: string, translated: string) => {
    setOriginalChineseQuery(original);
    setTranslatedQuery(translated);
  };
  
  const clearTranslation = () => {
    setTranslatedQuery(null);
    setOriginalChineseQuery(null);
  };
  
  return {
    lastInputWasChinese,
    originalChineseQuery,
    translatedQuery,
    checkIsChineseInput,
    storeTranslation,
    clearTranslation
  };
};
