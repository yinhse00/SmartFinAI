
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
    isBackupResponse?: boolean;  // Added missing property
    responseCompleteness?: {
      isComplete: boolean;
      confidence: 'low' | 'medium' | 'high';
      reasons?: string[];
    };
  };
}
