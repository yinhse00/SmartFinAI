
import { useMemo } from 'react';
import { Message } from '../ChatMessage';

interface LanguageDetectionResult {
  containsChinese: boolean;
  lastUserMessageIsChinese: boolean;
  getPlaceholder: () => string;
}

/**
 * Hook to detect language usage in the chat interface
 */
export const useLanguageDetection = (
  messages: Message[],
  input: string
): LanguageDetectionResult => {
  return useMemo(() => {
    // Check if any Chinese text exists in input or messages
    const containsChinese = Boolean(
      input.match(/[\u4e00-\u9fa5]/g) || 
      messages.some(m => m.content && m.content.match(/[\u4e00-\u9fa5]/g))
    );
    
    // Get most recent user message language for UI labels
    const lastUserMessage = [...messages].reverse().find(m => m.sender === 'user');
    const lastUserMessageIsChinese = Boolean(
      lastUserMessage?.content && /[\u4e00-\u9fa5]/.test(lastUserMessage.content)
    );
    
    // Helper to get the appropriate placeholder text based on language
    const getPlaceholder = () => {
      return lastUserMessageIsChinese 
        ? "输入您的查询..." 
        : "Type your query...";
    };

    return {
      containsChinese,
      lastUserMessageIsChinese,
      getPlaceholder
    };
  }, [messages, input]);
};
