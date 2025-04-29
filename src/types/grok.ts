
export interface GrokRequestParams {
  prompt: string;
  apiKey?: string;
  regulatoryContext?: string;
  reasoning?: string;
  maxTokens?: number;
  temperature?: number;
  // Add environment consistency properties
  envSignature?: string;
  requestId?: string;
  consistencyMode?: boolean;
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
    // Add environment info property
    environmentInfo?: {
      requestId?: string;
      isProduction?: boolean;
      envSignature?: string;
      processingTime?: number;
      error?: boolean;
      isBackupResponse?: boolean;
    };
  };
}
