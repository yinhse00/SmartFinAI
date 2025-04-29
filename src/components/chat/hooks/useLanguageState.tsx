
import { useState } from 'react';

/**
 * Hook to manage language state
 */
export const useLanguageState = () => {
  const [lastInputWasChinese, setLastInputWasChinese] = useState(false);
  
  const checkIsChineseInput = (input: string): boolean => {
    const containsChinese = /[\u4e00-\u9fa5]/.test(input);
    setLastInputWasChinese(containsChinese);
    return containsChinese;
  };
  
  return {
    lastInputWasChinese,
    checkIsChineseInput
  };
};
