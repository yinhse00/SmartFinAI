
export interface GrokRequestParams {
  prompt: string;
  temperature?: number;
  maxTokens?: number;
  regulatoryContext?: string;
  apiKey?: string;
}

export interface GrokResponse {
  text: string;
  queryType?: string;
  hasContext?: boolean;
  relevanceScore?: number;
  metadata?: {
    contextUsed?: boolean;
    relevanceScore?: number;
    tradingArrangementInfoUsed?: boolean;
    takeoversCodeUsed?: boolean;
    whitewashInfoIncluded?: boolean;
    referenceDocumentsUsed?: boolean;
    isBackupResponse?: boolean;
    error?: string;  // Added this property to fix the type error
    responseCompleteness?: {
      isComplete: boolean;
      confidence: 'low' | 'medium' | 'high';
      reasons?: string[];
    };
  };
}
