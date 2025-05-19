
import { GrokRequestParams, GrokResponse } from '@/types/grok';

export type ChatCompletionMessage = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};

export type ChatCompletionRequest = {
  model: string;
  messages: ChatCompletionMessage[];
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  presence_penalty?: number;
  frequency_penalty?: number;
  metadata?: Record<string, any>;
};

export type CategoryConfidence = {
  category: string;
  confidence: number;
  priority: number;
};

export type InitialAssessment = {
  isRegulatoryRelated: boolean;
  categories: CategoryConfidence[];
  reasoning: string;
  suggestedContextSources?: string[];
  estimatedComplexity: 'simple' | 'moderate' | 'complex';
  requiresParallelProcessing?: boolean;
  isNewListingQuery?: boolean;
};

export type SearchResult = {
  context: string;
  reasoning: string;
  usedSummaryIndex?: boolean;
  searchStrategy?: string;
};

export type EnhancedContext = {
  context: string;
  reasoning: string;
  searchResults: any[];
  usedSummaryIndex: boolean;
};

export type ApiResponseFormat = {
  timestamp: number;
  requestId: string;
  status: 'success' | 'error';
  data?: any;
  error?: {
    message: string;
    code: string;
  };
};

export type GrokModelInfo = {
  id: string;
  name: string;
  description: string;
  capabilities: string[];
  maxTokens?: number;
};
