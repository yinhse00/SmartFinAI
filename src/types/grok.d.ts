
/**
 * Type definitions for Grok API interactions
 */

export interface GrokRequestParams {
  prompt: string;
  regulatoryContext?: string;
  maxTokens?: number;
  apiKey?: string;
  temperature?: number;
  queryType?: string;
}

export interface GrokResponse {
  text: string;
  queryType: string;
  metadata?: {
    contextUsed?: boolean;
    relevanceScore?: number;
    isBackupResponse?: boolean;
    mayRequireBatching?: boolean;
    batchSuggestion?: string;
    truncated?: boolean;
    tokenUsage?: number;
    [key: string]: any;
  };
}

export interface VisionMessage {
  role: string;
  content: Array<{
    type: string;
    text?: string;
    image_url?: { url: string };
  }>;
}

export interface GrokVisionRequestBody {
  model: string;
  messages: VisionMessage[];
  temperature?: number;
  max_tokens?: number;
}
