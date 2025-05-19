
export interface GrokRequestParams {
  prompt: string;
  apiKey?: string;
  regulatoryContext?: string;
  reasoning?: string;
  maxTokens?: number;
  temperature?: number;
  format?: string;
  model?: string; // Added the model property
}

export interface GrokResponse {
  text: string;
  queryType: string;
  batchPart?: number;
  metadata?: {
    contextUsed?: boolean;
    relevanceScore?: number;
    tradingArrangementInfoUsed?: boolean;
    takeoversCodeUsed?: boolean;
    whitewashInfoIncluded?: boolean;
    referenceDocumentsUsed?: boolean;
    isBackupResponse?: boolean;
    responseCompleteness?: {
      isComplete: boolean;
      confidence: string;
      reasons?: string[];
      missingElements?: string[];
    };
    error?: string;
    sequentialSearchProcess?: {
      usedListingRules: boolean;
      usedTakeoversCode: boolean;
      usedGuidance: boolean;
    };
    responseWasTruncated?: boolean;
    isOfflineMode?: boolean;
  };
}
