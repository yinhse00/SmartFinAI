
import { useMemo } from 'react';
import { Message } from '../ChatMessage';

interface LanguageDetectionResult {
  containsChinese: boolean;
  lastUserMessageIsChinese: boolean;
  isTraditionalChinese: boolean;
  isSimplifiedChinese: boolean;
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
    const lastUserMessageText = lastUserMessage?.content || '';
    const lastUserMessageIsChinese = Boolean(
      lastUserMessage?.content && /[\u4e00-\u9fa5]/.test(lastUserMessage.content)
    );
    
    // Detect traditional vs simplified Chinese
    // Some common traditional Chinese characters that differ from simplified
    const traditionalChars = '國際車時書長東門開個隻馬觀華語學風雲無與舊';
    const isTraditionalChinese = lastUserMessageIsChinese && 
      traditionalChars.split('').some(char => lastUserMessageText.includes(char));
    
    const isSimplifiedChinese = lastUserMessageIsChinese && !isTraditionalChinese;
    
    // Helper to get the appropriate placeholder text based on language
    const getPlaceholder = () => {
      return lastUserMessageIsChinese 
        ? "输入您的查询..." 
        : "Type your query...";
    };

    return {
      containsChinese,
      lastUserMessageIsChinese,
      isTraditionalChinese,
      isSimplifiedChinese,
      getPlaceholder
    };
  }, [messages, input]);
};
