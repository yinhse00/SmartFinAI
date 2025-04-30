
export interface Message {
  id: string;
  content: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  references?: string[];
  metadata?: any;
  isUsingFallback?: boolean;
  reasoning?: string;
  isError?: boolean;
  queryType?: string;
  isTruncated?: boolean;
  isBatchPart?: boolean;
  isTranslated?: boolean;
  originalContent?: string;
}

// Export a default empty component to fix import issues
export default function ChatMessage() {}
