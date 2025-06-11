
// This file directly defines and exports the Message type to avoid circular dependencies
export interface Message {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
  sender?: 'user' | 'bot';
  references?: string[];
  isError?: boolean;
  isUsingFallback?: boolean;
  reasoning?: string;
  queryType?: string;
  isTruncated?: boolean;
  isBatchPart?: boolean;
  originalContent?: string;
  translationInProgress?: boolean;
  isTranslated?: boolean;
  metadata?: {
    financialQueryType?: string;
    reasoning?: string;
    processingTime?: number;
    model?: string;
    temperature?: number;
    maxTokens?: number;
    isTruncated?: boolean;
    isError?: boolean;
    translation?: string;
    guidanceMaterialsUsed?: boolean;
    sourceMaterials?: string[];
    searchStrategy?: 'local_only' | 'live_only' | 'hybrid' | 'failed';
    liveResultsCount?: number;
    localResultsCount?: number;
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
    regulatoryContext?: string;
    queryType?: string;
    financialAnalysis?: any;
    isUsingFallback?: boolean;
    verified?: boolean;
  };
  verified?: boolean;
}

// Export the ChatMessage component from the implementation file
export { ChatMessage } from './ChatMessage.tsx';
