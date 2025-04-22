
// Re-export types from main types file using 'export type'
export type { GrokRequestParams, GrokResponse } from '@/types/grok';

export interface GrokChatRequestBody {
  messages: {
    role: string;
    content: string;
  }[];
  model: string;
  temperature?: number;
  max_tokens?: number;
}
