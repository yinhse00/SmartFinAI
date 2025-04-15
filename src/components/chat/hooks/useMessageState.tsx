
import { useState } from 'react';
import { Message } from '../ChatMessage';

/**
 * Hook to manage chat message state
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

  return {
    messages,
    setMessages
  };
};
