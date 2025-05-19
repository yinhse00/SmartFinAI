
// This file directly defines and exports the Message type to avoid circular dependencies
export interface Message {
  id: string;
  sender: 'user' | 'bot';  // Removing 'system' to match the type used in ChatMessage.tsx
  content: string;
  timestamp: Date;
  references?: string[];
  isUsingFallback?: boolean;
  reasoning?: string;
  isError?: boolean;
  queryType?: string;
  isTruncated?: boolean;
  isBatchPart?: boolean;
  isTranslated?: boolean;
  originalContent?: string;
  translationInProgress?: boolean;
  isStreaming?: boolean;  // Added streaming flag
  metadata?: any;
}

// Export the ChatMessage component from the implementation file
export { ChatMessage } from './ChatMessage.tsx';
