
// This file directly defines and exports the Message type to avoid circular dependencies
export interface Message {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
  sender?: 'user' | 'bot' | 'system';
  references?: string[];
  isError?: boolean;
  isUsingFallback?: boolean;
  reasoning?: string;
  queryType?: string;
  isTruncated?: boolean;
  isBatchPart?: boolean;
  originalContent?: string;
  translationInProgress?: boolean;
  metadata?: {
    financialQueryType?: string;
    reasoning?: string;
    processingTime?: number;
    model?: string;
    temperature?: number;
    maxTokens?: number;
    isTruncated?: boolean;
    isError?: boolean;
    validation?: {
      isValid: boolean;
      vettingConsistency: boolean;
      guidanceConsistency: boolean;
      validationNotes: string[];
      confidence: number;
    };
    vettingRequired?: boolean;
    vettingCategory?: string;
    relevantGuidance?: number;
    guidanceTypes?: string[];
  };
  verified?: boolean;
}

// Export the ChatMessage component from the implementation file
export { ChatMessage } from './ChatMessage.tsx';
