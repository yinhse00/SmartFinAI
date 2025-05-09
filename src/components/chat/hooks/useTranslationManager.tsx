
import { useState, useEffect } from 'react';
import { Message } from '../ChatMessage';
import { grokService } from '@/services/grokService';

/**
 * Hook for managing translations of messages
 */
export const useTranslationManager = () => {
  const [translatingMessages, setTranslatingMessages] = useState<string[]>([]);

  useEffect(() => {
    // Clean up any translation tasks when the component unmounts
    return () => {
      setTranslatingMessages([]);
    };
  }, []);

  /**
   * Manages the translation of messages
   */
  const manageTranslations = async (
    messages: Message[],
    messageIndex: number
  ) => {
    if (messageIndex < 0 || messageIndex >= messages.length) {
      return;
    }

    const message = messages[messageIndex];
    if (!message || !message.content) {
      return;
    }

    try {
      // Add the message to the translating list
      setTranslatingMessages(prev => [...prev, message.id]);

      // Translate the content from English to Chinese
      const translation = await grokService.translateContent({
        content: message.content,
        sourceLanguage: 'en',
        targetLanguage: 'zh'
      });

      // Remove from translating list
      setTranslatingMessages(prev => prev.filter(id => id !== message.id));

      if (translation && typeof translation === 'object' && 'text' in translation) {
        // Store the translation in the message metadata
        if (!messages[messageIndex].metadata) {
          messages[messageIndex] = {
            ...messages[messageIndex],
            metadata: { translation: translation.text }
          };
        } else {
          const updatedMetadata = {
            ...messages[messageIndex].metadata,
            translation: translation.text
          };
          
          messages[messageIndex] = {
            ...messages[messageIndex],
            metadata: updatedMetadata
          };
        }
      }
    } catch (error) {
      console.error('Translation error:', error);
      // Remove from translating list even if there's an error
      setTranslatingMessages(prev => prev.filter(id => id !== message.id));
    }
  };

  return {
    translatingMessageIds: translatingMessages,
    manageTranslations
  };
};
