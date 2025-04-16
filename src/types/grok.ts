
export interface GrokRequestParams {
  prompt: string;
  temperature?: number;
  maxTokens?: number;
  regulatoryContext?: string;
}

export interface GrokResponse {
  text: string;
  queryType?: string;
  hasContext?: boolean; // Add the missing property
  relevanceScore?: number; // Added this to match the implementation in grokResponseGenerator.ts
  metadata?: {
    contextUsed?: boolean;
    relevanceScore?: number;
    tradingArrangementInfoUsed?: boolean;
    takeoversCodeUsed?: boolean;
    whitewashInfoIncluded?: boolean;
    referenceDocumentsUsed?: boolean;
    responseCompleteness?: {
      isComplete: boolean;
      confidence: 'low' | 'medium' | 'high';
      reasons?: string[];
    };
  };
}
