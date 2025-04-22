
import { useState } from 'react';
import { Message } from '../ChatMessage';

const INITIAL_MESSAGE: Message = {
  id: '1',
  content: "Hello! I'm your Hong Kong financial regulatory assistant. How can I help you navigate complex financial regulations and corporate governance today?",
  sender: 'bot',
  timestamp: new Date(),
};

/**
 * Hook to manage chat message state with memory clearing functionality
 */
export const useMessageState = () => {
  const [messages, setMessages] = useState<Message[]>([INITIAL_MESSAGE]);

  // New method to clear conversation memory
  const clearConversationMemory = () => {
    setMessages([INITIAL_MESSAGE]);
  };

  return {
    messages,
    setMessages,
    clearConversationMemory
  };
};
