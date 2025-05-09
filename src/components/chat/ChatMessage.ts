
export interface Message {
  id: string;
  sender: 'user' | 'bot' | 'system';
  content: string;
  timestamp: Date;
  isError?: boolean;
  metadata?: {
    translation?: string;
    mayRequireBatching?: boolean;
    batchSuggestion?: string;
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
    [key: string]: any;
  };
}
