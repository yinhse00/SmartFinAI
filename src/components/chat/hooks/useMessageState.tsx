
import { useState } from 'react';
import { Message } from '../ChatMessage';
import { useToast } from '@/hooks/use-toast';

/**
 * Hook to manage chat message state with memory clearing functionality
 * and improved data source tracking
 */
export const useMessageState = () => {
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: 'Hello! I\'m your Hong Kong financial regulatory expert. How can I assist with your corporate finance, listing rules, or regulatory compliance questions today?',
      role: 'assistant',
      sender: 'bot', 
      timestamp: Date.now(),
    }
  ]);

  // New method to clear conversation memory with notification
  const clearConversationMemory = () => {
    setMessages([
      {
        id: '1',
        content: 'Hello! I\'m your Hong Kong financial regulatory expert. How can I assist with your corporate finance, listing rules, or regulatory compliance questions today?',
        role: 'assistant',
        sender: 'bot',
        timestamp: Date.now(),
      }
    ]);
    
    toast({
      title: "Conversation History Cleared",
      description: "Previous conversation history has been cleared. Starting fresh.",
      duration: 3000,
    });
  };
  
  // New helper function to append data source information to messages
  const appendDataSourceInfo = (messageId: string, sources: string[]) => {
    setMessages(prevMessages => 
      prevMessages.map(msg => 
        msg.id === messageId 
          ? { ...msg, references: [...(msg.references || []), ...sources] }
          : msg
      )
    );
  };

  return {
    messages,
    setMessages,
    clearConversationMemory,
    appendDataSourceInfo
  };
};
