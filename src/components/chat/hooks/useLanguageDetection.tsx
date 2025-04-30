
import { useMemo } from 'react';
import { Message } from '../ChatMessage';

/**
 * Hook to detect language context in messages
 */
export const useLanguageDetection = (
  messages: Message[],
  currentInput: string
) => {
  // Check if the last user message was in Chinese
  const lastUserMessageIsChinese = useMemo(() => {
    // First check current input
    if (currentInput && hasChineseCharacters(currentInput)) {
      return true;
    }
    
    // Then check last user message
    const userMessages = messages.filter(m => m.role === 'user');
    if (userMessages.length > 0) {
      const lastUserMessage = userMessages[userMessages.length - 1];
      return hasChineseCharacters(lastUserMessage.content);
    }
    
    return false;
  }, [messages, currentInput]);
  
  // Get appropriate placeholder text based on language
  const getPlaceholder = () => {
    if (lastUserMessageIsChinese) {
      return '请输入您的问题，我们将为您提供专业的金融监管咨询...';
    }
    return 'Enter your question about financial regulations...';
  };
  
  // Helper function to detect Chinese characters
  function hasChineseCharacters(text: string): boolean {
    // Unicode ranges for Chinese characters
    return /[\u4e00-\u9fff]/.test(text);
  }

  return {
    lastUserMessageIsChinese,
    getPlaceholder
  };
};
