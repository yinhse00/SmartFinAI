
import { useState } from 'react';
import { Message } from '../ChatMessage';

/**
 * Hook to manage chat message state with memory clearing functionality
 */
export const useMessageState = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: 'Hello! I\'m your Hong Kong financial regulatory expert. How can I assist with your corporate finance, listing rules, or regulatory compliance questions today?',
      sender: 'bot',
      timestamp: new Date(),
    }
  ]);

  // New method to clear conversation memory
  const clearConversationMemory = () => {
    setMessages([
      {
        id: '1',
        content: 'Hello! I\'m your Hong Kong financial regulatory expert. How can I assist with your corporate finance, listing rules, or regulatory compliance questions today?',
        sender: 'bot',
        timestamp: new Date(),
      }
    ]);
  };

  return {
    messages,
    setMessages,
    clearConversationMemory
  };
};

