
import { GrokRequestParams, GrokResponse } from '@/types/grok';

export type ChatCompletionMessageContent = 
  | string 
  | Array<{
      type: string;
      text?: string;
      image_url?: { url: string };
    }>;

export type ChatCompletionMessage = {
  role: 'system' | 'user' | 'assistant';
  content: ChatCompletionMessageContent;
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
  stream?: boolean;  // Added streaming support
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
  cacheHit?: boolean;  // Added cache indicator
  cacheAge?: number;   // Added cache age tracking
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

export type ProgressCallback = (progress: number, stage: string) => void;  // Added for progressive updates
