
export interface GrokRequestParams {
  prompt: string;
  temperature?: number;
  maxTokens?: number;
  regulatoryContext?: string;
}

export interface GrokResponse {
  text: string;
  queryType?: string;
  metadata?: {
    contextUsed?: boolean;
    relevanceScore?: number;
    tradingArrangementInfoUsed?: boolean;
    takeoversCodeUsed?: boolean;
    whitewashInfoIncluded?: boolean;
  };
}
